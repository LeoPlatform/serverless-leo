use lambda::{handler_fn, run};
use serde_json::{json, Value};

type Error = Box<dyn std::error::Error + Send + Sync + 'static>;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let handler = handler_fn(hello_world);
    run(handler).await?;
    Ok(())
}


async fn hello_world(_event: Value, _context: lambda::Context) -> Result<(), Box<dyn std::error::Error + Send + Sync + 'static>> {
    println!("Hello, World");
    Ok(())
}