use lambda_runtime::Context;
use rstreams::events::WriteEvent;
use rstreams::{BotInvocationEvent, Error, LeoSdk, LeoWriteOptions, RefreshingProvider};
use serde::{Deserialize, Serialize};
use tokio::sync::OnceCell;

// Built once per Lambda execution environment so warm invocations reuse its clients.
static PROVIDER: OnceCell<RefreshingProvider> = OnceCell::const_new();

#[derive(Deserialize, Serialize, Debug)]
struct MyWriteEvent {
    suborder_id: usize,
    order_created: String,
    number_of_line_items: usize,
    po_number: String,
    order_status: String,
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    rstreams::run(load_data).await
}

async fn load_data(event: BotInvocationEvent<()>, context: Context) -> Result<(), Error> {
    let provider = PROVIDER
        .get_or_try_init(|| async { RefreshingProvider::from_environment().await })
        .await?;
    let sdk = LeoSdk::new((*provider.refreshed().await).clone());
    let bot_id = &event.bot_id;
    let dest_queue = "DESTINATION_TOKEN";

    sdk.cron(&event.__cron, &context, || async {
        sdk.load(
            futures::stream::iter(vec![Ok(WriteEvent {
                id: bot_id.to_owned(),
                event: dest_queue.to_owned(),
                timestamp: chrono::Utc::now().timestamp_millis() as u64,
                payload: Some(MyWriteEvent {
                    suborder_id: 12345,
                    order_created: "yes".to_string(),
                    number_of_line_items: 2,
                    po_number: uuid::Uuid::new_v4().to_string(),
                    order_status: "processing".to_string(),
                }),
                ..Default::default()
            })]),
            LeoWriteOptions::default().with_initial_values(&event),
        )
        .await
        .map_err(|e| e.into())
    })
    .await
}
