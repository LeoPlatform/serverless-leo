use serde::{Deserialize, Serialize};
use rstreams::{events::Event, BotInvocationEvent, LeoCheckpointOptions, LeoReadOptions, LeoSdk, AllProviders, LeoWriteOptions, Error};
use rstreams::aws::AWSProvider;
use rusoto_signature::Region;
use lambda::{run, handler_fn};
use rstreams::events::WriteEvent;

pub struct ExampleSdkConfig;

impl ExampleSdkConfig {
    #[allow(dead_code)]
    pub fn dsco_test_bus() -> AllProviders {
        AllProviders::AWS(AWSProvider::new(
            Region::UsEast1,
            "TestBus-LeoStream-R2VV0EJ6FRI9",
            "TestBus-LeoCron-OJ8ZNCEBL8GM",
            "TestBus-LeoEvent-FNSO733D68CR",
            "testbus-leos3-1erchsf3l53le",
            "TestBus-LeoKinesisStream-1XY97YYPDLVQS",
            "TestBus-LeoFirehoseStream-1M8BJL0I5HQ34",
        ))
    }
}

#[derive(Deserialize, Serialize, Debug)]
struct MyReadEvent {
    suborder_id: usize,
    order_created: String,
    number_of_line_items: usize,
    po_number: String,
    order_status: String,
}


#[derive(Deserialize, Serialize, Debug)]
struct EnrichedWriteEvent {
    suborder_id: usize,
    po_number: String,
    order_status: String,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(handler_fn(enrich)).await?;
    Ok(())
}


async fn enrich(event: BotInvocationEvent<()>, context: lambda::Context) -> Result<(), Error> {

    let sdk = LeoSdk::new(ExampleSdkConfig::dsco_test_bus());
    let bot_id = &event.bot_id;
    let source_queue = "SOURCE_TOKEN";
    let dest_queue = "DESTINATION_TOKEN";

    sdk.cron(&event.__cron, &context, || async {
        sdk.enrich(
            bot_id,
            source_queue,
            LeoReadOptions::default(),
            LeoWriteOptions::default().with_initial_values(&event),
            |event: Event<MyReadEvent>| {
                futures::future::ready(match &event.payload {
                    Some(data) => Some(Ok(WriteEvent::from_read_event(
                        bot_id,
                        dest_queue,
                        Some(EnrichedWriteEvent {
                            suborder_id: data.suborder_id.clone(),
                            po_number: data.po_number.clone(),
                            order_status: "shipped".to_string(),
                        }),
                        &event,
                    )
                    .into())),
                    None => None,
                })
            },
        )
        .await
        .map_err(|e| e.into())
    })
    .await?;

    Ok(())
}