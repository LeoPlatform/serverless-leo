use anyhow::anyhow;
use lambda_runtime::Context;
use rstreams::events::Event;
use rstreams::{
    BotInvocationEvent, Error, LeoCheckpointOptions, LeoReadOptions, LeoSdk, RefreshingProvider,
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

#[tokio::main]
async fn main() -> Result<(), Error> {
    rstreams::run(offload).await
}

async fn offload(event: BotInvocationEvent<()>, context: Context) -> Result<(), Error> {
    let provider = PROVIDER
        .get_or_try_init(|| async { RefreshingProvider::from_environment().await })
        .await?;
    let sdk = LeoSdk::new((*provider.refreshed().await).clone());
    let bot_id = &event.bot_id;
    let source_queue = "SOURCE_TOKEN";

    sdk.cron(&event.__cron, &context, || async {
        sdk.offload(
            bot_id,
            source_queue,
            LeoReadOptions::default(),
            LeoCheckpointOptions::Enabled.with_initial_values(&event),
            |event: Event<MyReadEvent>| async move {
                //offload processing here
                match processing_function(&event.eid).await {
                    Ok(()) => Some(Ok(())),
                    Err(err) => Some(Err(anyhow!("Failed to process event {}", err))),
                }
            },
        )
        .await
        .map_err(|e| e.into())
    })
    .await
}

async fn processing_function(eid: &str) -> anyhow::Result<()> {
    println!("Handling event eid: {}", eid);
    Ok(())
}
