use lambda_runtime::{service_fn, Error, LambdaEvent};
use serde_json::Value;

#[tokio::main]
async fn main() -> Result<(), Error> {
    lambda_runtime::run(service_fn(hello_world)).await
}

async fn hello_world(_event: LambdaEvent<Value>) -> Result<(), Error> {
    println!("Hello, World");
    Ok(())
}
