use lambda_runtime::Context;
use rstreams::events::{Event, WriteEvent};
use rstreams::{
    BotInvocationEvent, Error, LeoReadOptions, LeoSdk, LeoWriteOptions, RefreshingProvider,
};
use serde::{Deserialize, Serialize};
use tokio::sync::OnceCell;

// Built once per Lambda execution environment so warm invocations reuse its clients.
static PROVIDER: OnceCell<RefreshingProvider> = OnceCell::const_new();

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
    rstreams::run(enrich).await
}

async fn enrich(event: BotInvocationEvent<()>, context: Context) -> Result<(), Error> {
    let provider = PROVIDER
        .get_or_try_init(|| async { RefreshingProvider::from_environment().await })
        .await?;
    let sdk = LeoSdk::new((*provider.refreshed().await).clone());
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
                //enrichment process here
                futures::future::ready(event.payload.as_ref().map(|data| {
                    Ok(WriteEvent::from_read_event(
                        bot_id,
                        dest_queue,
                        Some(EnrichedWriteEvent {
                            suborder_id: data.suborder_id,
                            po_number: data.po_number.clone(),
                            order_status: "shipped".to_string(),
                        }),
                        &event,
                    )
                    .into())
                }))
            },
        )
        .await
        .map_err(|e| e.into())
    })
    .await
}
