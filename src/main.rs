use axum::{
    Router,
    extract::{
        State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    response::IntoResponse,
    routing::get,
};
use futures_util::{SinkExt, StreamExt};
use std::sync::Arc;
use tokio::sync::broadcast;
use tower_http::services::ServeDir;

// We use a broadcast channel to send messages to all connected clients.
struct AppState {
    // We send drawing events as Strings (JSON) to this channel
    tx: broadcast::Sender<String>,
}

#[tokio::main]
async fn main() {
    println!("Starting real-time whiteboard server...");

    // Create a broadcast channel with a capacity of 100 messages.
    let (tx, _rx) = broadcast::channel(100);

    let app_state = Arc::new(AppState { tx });

    // Serve static files from the "static" directory
    let static_files = ServeDir::new("static");

    let app = Router::new()
        .fallback_service(static_files)
        .route("/ws", get(ws_handler))
        .with_state(app_state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0")
        // let listener = tokio::net::TcpListener::bind("127.0.0.1:3000")
        .await
        .unwrap();
    println!("Listening on {}", listener.local_addr().unwrap());

    axum::serve(listener, app).await.unwrap();
}

async fn ws_handler(ws: WebSocketUpgrade, State(state): State<Arc<AppState>>) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: Arc<AppState>) {
    let (mut sender, mut receiver) = socket.split();

    // Subscribe to the broadcast channel
    let mut rx = state.tx.subscribe();

    // Task to receive messages from the broadcast channel and send to the WebSocket client
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            // Send the message to the client
            if sender.send(Message::Text(msg.into())).await.is_err() {
                break;
            }
        }
    });

    // Task to receive messages from the WebSocket client and broadcast them
    let tx = state.tx.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(Message::Text(text))) = receiver.next().await {
            // Broadcast the message to all clients
            let _ = tx.send(text.to_string());
        }
    });

    // If either task finishes (client disconnects or error), abort the other
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    };
}
