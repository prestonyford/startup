const username = localStorage.getItem("username");

async function loadHistory() {
    try {
        const response = await fetch('/api/history?room=A');
        data = await response.json();
        for (const message of data.history) {
            if (message.type === "system") { // System message
                insert_message_element(create_system_message_element(message.content));
            }
            else if (message.type === "image") { // Image message
                insert_message_element(create_image_message_element(message.author, message.content));
            }
            else{ // Normal message
                if (message.author === username) {
                    insert_message_element(create_self_message_element(message.content));
                }
                else {
                    insert_message_element(create_other_message_element(message.author, message.content));
                }
            }
        }
    }
    catch(error) {
        console.error(error);
    }
}

window.onload = async () => {
    await loadHistory()

    // Subscribe to events
    const send_btn = document.getElementById("send-message-button");
    send_btn.addEventListener("click", () => {
        send_message_to_server(...Object.values(read_message_textbox()))
    });

    const message_text_box = document.getElementById("message-text-box");
    message_text_box.addEventListener("keydown", (e) => {
        if (e.key === 'Enter'){
            send_message_to_server(...Object.values(read_message_textbox()))
        }
    })

    const search_btn = document.getElementById("gif-search-button");
    search_btn.addEventListener("click", () => {
        search_gif(read_gif_search_textbox());
    })

    const search_text_box = document.getElementById("gif-search-text-box");
    search_text_box.addEventListener("keydown", (e) => {
        if (e.key === 'Enter'){
            search_gif(read_gif_search_textbox());
        }
    })

    // Send join message
    send_message_to_server("system", "", `${username} joined the room`);
}

function create_system_message_element(content) {
    const new_message = document.createElement("div");
    new_message.classList.add("message-system");

    const content_span = document.createElement("span");
    content_span.innerText = content;
    new_message.appendChild(content_span)

    return new_message;
}

function create_other_message_element(author, content) {
    const new_message = document.createElement("div");
    new_message.classList.add("message");
    new_message.classList.add("message-other");

    const author_span = document.createElement("span");
    author_span.classList.add("message-author");
    author_span.innerText = author;
    new_message.appendChild(author_span)
    
    const content_span = document.createElement("span");
    content_span.innerText = content;
    new_message.appendChild(content_span)
    
    return new_message;
}

function create_self_message_element(content) {
    const new_message = document.createElement("div");
    new_message.classList.add("message");
    new_message.classList.add("message-self");
    new_message.innerText = content;
    return new_message;
}

function create_image_message_element(author, image_url) {
    const new_message = document.createElement("div");
    new_message.classList.add("message");
    new_message.classList.add("message-image");

    if (author === username) {
        new_message.classList.add("message-self");
    }
    else {
        const author_span = document.createElement("span");
        author_span.classList.add("message-author");
        author_span.style.marginBottom = '4px';
        author_span.innerText = author;
        new_message.appendChild(author_span);
        new_message.classList.add("message-other");
    }
    
    const image_element = document.createElement("img");
    image_element.src = image_url;
    new_message.appendChild(image_element);

    return new_message;
}

function insert_message_element(message) {
    const container = document.getElementById("messages-container");
    const move = container.scrollTop === container.scrollHeight;
    container.appendChild(message);
}

function read_message_textbox() {
    const text_box = document.getElementById("message-text-box");
    const content = text_box.value;
    if (content === "") return;
    text_box.value = "";
    return {
        type: "message",
        author: username,
        content: content
    }
}

async function send_message_to_server(type, author, content) {
    try {
        const response = await fetch('/api/history', {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({
                room: 'A',
                message: {
                    type: type,
                    author: author,
                    content: content
                }
            }),
        });
  
        const message = await response.json();

        if (message.type === "system"){
            insert_message_element(create_system_message_element(message.content));
        }
        else if (message.type === "image") {
            insert_message_element(create_image_message_element(username, message.content));
        }
        else {
            insert_message_element(create_self_message_element(message.content));
        }
    } 
    catch(error) {
        console.error(error);
    }
}

// GIF

function read_gif_search_textbox() {
    const text_box = document.getElementById("gif-search-text-box");
    const content = text_box.value;
    if (content === "") return;
    text_box.value = "";
    return content;
}

async function search_gif(search_term) {
    try {
        const response = await fetch(`/api/gif?search_term=${search_term}`);
        const results = await response.json();
        display_search_results(results.results)
    }
    catch(error) {
        console.error(error);
    }
}

function create_gif_element(gif_object) {
    const tiny_gif = gif_object.media_formats.tinygif; // Smaller image for previews
    const gif = gif_object.media_formats.gif; // Actual image for sending
    console.log(gif_object);

    const element = document.createElement("div");
    // element.classList.add("");
    const image_element = document.createElement("img")
    image_element.src = tiny_gif.url;
    element.appendChild(image_element);

    // Click event listener
    element.addEventListener("click", () => {
        send_message_to_server("image", username, gif.url);
    });
    element.style.cursor = 'pointer';

    return element;
}

function display_search_results(results) {
    // console.log(results);
    const results_window = document.getElementById('gif-search-results');
    results_window.innerHTML = "";
    for (result of results) {
        results_window.appendChild(create_gif_element(result))
    }
}