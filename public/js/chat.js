const socket = io();
const $sendLocation = document.querySelector("#sendLocation");
const $messageForm = document.querySelector("#message-form");
const $messageInput = $messageForm.querySelector("input");
const $messageButton = $messageForm.querySelector("button");
const $message = document.querySelector("#message");
const $chatSidebar = document.querySelector("#chat-sidebar");

const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // New message element
  const $newMessage = $message.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height
  const visibleHeight = $message.offsetHeight;

  // Height of messages container
  const containerHeight = $message.scrollHeight;

  // How far have I scrolled?
  const scrollOffset = $message.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $message.scrollTop = $message.scrollHeight;
  }
};

socket.on("message", (message) => {
  // const containerHeight = $message.scrollHeight;
  // console.log(containerHeight);

  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("hh:mm a"),
  });
  $message.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({ room, users }) => {
  console.log(users, room);
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  $chatSidebar.innerHTML = html;
});

socket.on("locationMessage", (message) => {
  console.log(message);
  const html = Mustache.render(locationMessageTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("hh:mm a"),
  });
  $message.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  $messageButton.setAttribute("disabled", "disabled");
  const message = e.target.elements.message.value;
  socket.emit("sendMessage", message, (error) => {
    $messageButton.removeAttribute("disabled");
    $messageInput.value = "";
    $messageInput.focus();
    if (error) {
      return console.log(error);
    }
    console.log("Message Delevered!");
  });
});

$sendLocation.addEventListener("click", () => {
  $sendLocation.setAttribute("disabled", "disabled");
  if (!navigator.geolocation) {
    console.log("Location is not supported by your browser!");
  }

  navigator.geolocation.getCurrentPosition((position) => {
    $sendLocation.removeAttribute("disabled");
    socket.emit(
      "sendLocation",
      {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      },
      () => {
        console.log("Location Shared");
      }
    );
  });
});
console.log({ username, room });

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
