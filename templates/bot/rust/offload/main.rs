#[tokio::main]
async fn main() -> Result<(), Error> {
    dotenv::dotenv().ok();
    env_logger::init();

    // These are provided when runing a bot invoked by the bus
    let context = create_local_context("my_lambda_name", Duration::from_secs(30), 256);
    let invocation_event = BotInvocationEvent::new_local("offload_bot_test", ());

    let sdk = LeoSdk::new(common::ExampleSdkConfig::clint_test_bus());

    let bot_id = &invocation_event.bot_id;
    let source_queue = "enrich_write_test";

    sdk.cron(&invocation_event.__cron, &context, || async {
        sdk.offload(
            bot_id,
            source_queue,
            LeoReadOptions::default(),
            LeoCheckpointOptions::Enabled.with_initial_values(&invocation_event),
            |event: Event<MyReadEvent>| async move {
                println!("Handling event eid: {}", event.eid);
                tokio::time::sleep(Duration::from_millis(20)).await;
                Some(Ok(()))
            },
        )
        .await
        .map_err(|e| e.into())
    })
    .then(|r| async move {
        println!("Handler done!");
        r
    })
    .await
}
