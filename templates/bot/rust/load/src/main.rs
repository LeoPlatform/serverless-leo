use rstreams::{events::WriteEvent, BotInvocationEvent, LeoSdk, LeoWriteOptions, AllProviders, Error};

use serde::{Deserialize, Serialize};
use rstreams::aws::AWSProvider;
use rusoto_signature::Region;
use lambda::{run, handler_fn};

pub struct ExampleSdkConfig;

#[derive(Deserialize, Serialize, Debug)]
struct MyWriteEvent {
    suborder_id: usize,
    order_created: String,
    number_of_line_items: usize,
    po_number: String,
    order_status: String,
}


impl ExampleSdkConfig {
    pub fn bus_config() -> AllProviders {
        AllProviders::AWS(AWSProvider::new(
            Region::UsEast1,
            "",
            "",
            "",
            "",
            "",
            "",
        ))
    }
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    run(handler_fn(load_data)).await?;
    Ok(())
}


async fn load_data(event: BotInvocationEvent<()>, context: lambda::Context) -> Result<(), Error> {

    let sdk = LeoSdk::new(ExampleSdkConfig::bus_config());

    let bot_id = &event.bot_id;
    let dest_queue = "DESTINATION_TOKEN";

    sdk.cron(&event.__cron, &context, || async {
        sdk.load(
            futures_util::stream::iter(vec![
                Ok(WriteEvent {
                    id: bot_id.to_owned(),
                    event: dest_queue.to_owned(),
                    event_source_timestamp: None,
                    timestamp: chrono::Utc::now().timestamp_millis() as u64,
                    payload: Some(serde_json::json!( MyWriteEvent {
                        suborder_id: 12345,
                        order_created: "yes".to_string(),
                        number_of_line_items: 2,
                        po_number: uuid::Uuid::new_v4().to_string(),
                        order_status: "processing".to_string()

                    })),
                    correlation_id: None,
                })
            ]),
            LeoWriteOptions::default().with_initial_values(&event),
        )
            .await
            .map_err(|e| e.into())
    })
        .await?;

    Ok(())
}