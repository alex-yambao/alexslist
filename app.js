const STATE = {
  BASE_URL: "https://strangers-things.herokuapp.com/api/2103-USD-RM-WEB-PT",
  POSTS: [],
  MESSAGES: [],
  user: "",
  isLoggedIn: false,
  searchTerm: "",
};

//jQuery OBJECTS
//home screen objects
const overlay = $("#bg-modal");
const loginButton = $(".login");
const registerButton = $(".register");
const body = $("body");

//login screen objects
const loginScreen = $("#modal-content-login");
const loginForm = $(".login-form");
const loginSubmit = $(".login-submit");
const loginError = $("#loginError");

//registration screen objects
const registerScreen = $("#modal-content-register");
const registerForm = $(".register-form");
const regSubmit = $(".register-submit");
const regError = $("#register-error");

//post form
const postDiv = $(".new-post");
const postForm = $(".post-form");
const newPostButton = $(".post-button");
const postSubmit = $(".post-submit");
const description = $(".description");
const title = $(".new-post-title");
const price = $(".price");
const postSendStatus = $("#post-send-status");

//send message form
const messagesButton = $(".messages-button");
const messageDiv = $(".send-message");
const messageForm = $(".message-form");
const messageSubmit = $(".message-submit");
const content = $(".content");
const messageStatus = $("#message-status");
const messagesSection = $("#messages");
let msgPostId;

//postings section
const postingSection = $(".postings");
const postUser = $(".post-user");

//search
const searchText = $(".search");
const searchForm = $(".search-form");

//permissions UI display
const userMenu = $("#user-menu ul");
const guestGreet = $("#guest-greet");
const userGreet = $(".username");
const logoutButton = $("#logout");

//edit post form
const editButton = $(".edit");
const editSubmit = $(".edit-submit");
const editDiv = $(".edit-post");
const editPostForm = $("#edit-form");
const editDescription = $(".edit-description");
const editTitle = $(".edit-post-title");
const editPrice = $(".edit-price");
const editPostStatus = $("#edit-post-status");
let editPostID;

//helper functions for fetch calls
function getToken() {
  return localStorage.getItem("AL-token");
}

function getHeaders() {
  return {
    "Content-type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

//fetch Calls
async function grabUserInfo() {
  try {
    const response = await fetch(`${STATE.BASE_URL}/users/me`, {
      method: "GET",
      headers: getHeaders(),
    });
    const json = await response.json();
    if (json.success === false) {
      throw new Error(json.error.message);
    }
    if (json.success === true) {
      renderAllPosts();
      STATE.MESSAGES = json.data.messages;
      renderMessages();
    }
  } catch (error) {
    console.error(error.message);
  }
}

async function isLoggedIn() {
  try {
    const response = await fetch(`${STATE.BASE_URL}/test/me`, {
      method: "GET",
      headers: getHeaders(),
    });
    const json = await response.json();
    if (json.success === true) {
      STATE.isLoggedIn = true;
      grabUserInfo();
      STATE.user = json.data.user.username;
      getAllPosts();
    }
    if (json.success === false) {
      STATE.isLoggedIn = false;
      getAllPosts();
    }
  } catch (error) {
    console.warn(error);
  } finally {
    setPermissions();
  }
}

async function login(username, password) {
  try {
    const response = await fetch(`${STATE.BASE_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        user: {
          username: username,
          password: password,
        },
      }),
    });
    const json = await response.json();
    if (json.success === false) {
      throw new Error(json.error.message);
    }
    if (json.success === true) {
      localStorage.setItem("AL-token", json.data.token);
      loginScreen.toggle();
      overlay.toggle();
      isLoggedIn();
    }
  } catch (error) {
    loginError.toggleClass("active");
    loginError.text(`${error}`);
    console.error(error.message);
  }
}

async function createPost(post) {
  try {
    if (!post.title || !post.description || !post.price) {
      throw new Error("Missing Required Field");
    }
    const response = await fetch(`${STATE.BASE_URL}/posts`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ post }),
    });
    const json = await response.json();

    if (json.success === true) {
      postForm.trigger("reset");
      STATE.POSTS.push(json.data.post);
      renderSinglePost(json.data.post);
      postDiv.toggle();
    }
  } catch (error) {
    postSendStatus.toggleClass("active");
    postSendStatus.text(error);
  }
}

async function register(username, password) {
  try {
    const response = await fetch(`${STATE.BASE_URL}/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user: {
          username: username,
          password: password,
        },
      }),
    });
    const json = await response.json();
    if (json.success === false) {
      throw new Error(json.error.message);
    }
    if (json.success === true) {
      await login(username, password);
      grabUserInfo();
    }
    localStorage.setItem("AL-token", json.data.token);
  } catch (error) {
    regError.toggleClass("active");
    regError.text(`${error}`);
  }
}

async function getAllPosts() {
  try {
    const response = await fetch(`${STATE.BASE_URL}/posts`, {
      method: "GET",
      headers: getHeaders(),
    });
    const json = await response.json();
    if (json.success) {
      STATE.POSTS = json.data.posts;
      renderAllPosts();
    }
  } catch (error) {
    console.error(error);
  }
}

async function sendMessage(postID, formMessage) {
  try {
    const response = await fetch(`${STATE.BASE_URL}/posts/${postID}/messages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ message: formMessage }),
    });
    const json = await response.json();
    if (json.success === true) {
      messageStatus.toggleClass("active");
      messageStatus.text("Message sent!");
      messageForm.trigger("reset");
      messageDiv.toggle();
    }
  } catch (error) {
    messageStatus.toggleClass("active");
    messageStatus.text("Message sent unsuccessfully!");
  }
}

async function deletePost(id) {
  try {
    const response = await fetch(`${STATE.BASE_URL}/posts/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const json = await response.json();
  } catch (error) {
    console.error(error);
  }
}

async function editPost(editPostID, post) {
  try {
    if (!post.title || !post.description || !post.price) {
      throw new Error("Missing Required Field");
    }
    const response = await fetch(`${STATE.BASE_URL}/posts/${editPostID}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ post }),
    });
    const json = await response.json();
    if (json.success === true) {
      editPostForm.trigger("reset");
      editDiv.toggle();
      getAllPosts();
    }
  } catch (error) {
    editPostStatus.toggleClass("active");
    editPostStatus.text(error);
  }
}

function setPermissions() {
  if (STATE.isLoggedIn == true) {
    userMenu.addClass("active");
    guestGreet.removeClass("active").addClass("disabled");
    userGreet.text(`${STATE.user}`);
    logoutButton.addClass("active");
    messagesSection.addClass("active");
  } else {
    userMenu.removeClass("active");
    guestGreet.removeClass("disabled").addClass("active");
    userGreet.text("");
    logoutButton.removeClass("active");
    messagesSection.removeClass("active");
  }
}

//render functions

function renderAllPosts() {
  postingSection.empty();
  STATE.POSTS.forEach(function (post) {
    const postObj = createPostObj(post);
    postingSection.append(postObj);
  });
}

function renderSinglePost(post) {
  const postObj = createPostObj(post);
  postingSection.append(postObj);
}

function renderPostList(postList) {
  postingSection.empty();
  postList.forEach(function (post) {
    let postObj = createPostObj(post);
    postingSection.append(postObj);
  });
}

function renderMessages() {
  messagesSection.empty();
  STATE.MESSAGES.forEach(function (message) {
    const messageObj = createMessageObj(message);
    messagesSection.append(messageObj);
  });
}

function createPostObj(post) {
  let postObj;
  if (STATE.isLoggedIn == false) {
    postObj = `
  <div class="post-card" data-postid= "${post._id}"
  data-user="${post.author.username}">
  <h1>${post.title}</h1>
  <h2>${post.author.username}</h2>
  <h3>${post.location}</h3>
  <h4>${post.price}</h4>
  <p>${post.description}</p>
  </div>
  `;
  } else if (STATE.isLoggedIn == true && post.author.username !== STATE.user) {
    postObj = `<div class="post-card"
    data-postid= "${post._id}"
    data-user="${post.author.username}">
    <h1>${post.title}</h1>
    <h2>${post.author.username}</h2>
    <h3>${post.location}</h3>
    <h4>${post.price}</h4>
    <p>${post.description}</p>
    <button class="sendMessage">SEND MESSAGE</button>
    </div>`;
  } else if (STATE.isLoggedIn == true && post.author.username == STATE.user) {
    postObj = `<div class="post-card"
    data-post_title="${post.title}"
    data-post_price="${post.price}"
    data-post_desc= "${post.description}"
    data-postid= "${post._id}"
    data-user="${post.author.username}">
    <h1 class="post-title">${post.title}</h1>
    <h2>${post.author.username}</h2>
    <h3>${post.location}</h3>
    <h4>${post.price}</h4>
    <p>${post.description}</p>
    <button class="edit">EDIT</button>
    <button class="delete">DELETE</button>
    </div>
    `;
  }
  return postObj;
}

function createMessageObj(message) {
  return `
  <div class="message-card"
  <h1>From: ${message.fromUser.username}</h1>
  <h3>Regarding: ${message.post.title}</h3><br>
  <p>${message.content}</p>
  </div>
  `;
}

//user interactions and click functions

loginButton.on("click", function () {
  overlay.toggleClass("active");
  loginScreen.toggleClass("active");
});

loginSubmit.on("click", function (e) {
  e.preventDefault();
  const loginUsername = $(".user-login").val();
  const loginPassword = $(".password-login").val();
  login(loginUsername, loginPassword);
});

function logout() {
  localStorage.clear("AL-token");
  STATE.POSTS = [];
  STATE.isLoggedIn = false;
  isLoggedIn();
}

registerButton.on("click", registerButton, function () {
  overlay.toggleClass("active");
  registerScreen.toggleClass("active");
});

regSubmit.on("click", async function (event) {
  event.preventDefault();
  const regUsername = $(".user-reg").val();
  const regPassword = $(".password-reg").val();
  const reg = await register(regUsername, regPassword);
  registerForm.trigger("reset");
});

newPostButton.on("click", function () {
  postDiv.toggle();
});

postSubmit.on("click", async function (e) {
  e.preventDefault();
  const descriptionText = description.val();
  const titleText = title.val();
  const priceText = price.val();
  const post = {
    title: titleText,
    description: descriptionText,
    price: priceText,
    willDeliver: true,
  };
  await createPost(post);
});

$(document).on("click", "button.delete", function (e) {
  e.preventDefault();
  let parentDiv = $(this).closest("div");
  let postId = parentDiv.data("postid");
  deletePost(postId);
  parentDiv.remove();
});

$(document).on("click", "button.sendMessage", function (e) {
  e.preventDefault();
  let parentDiv = $(this).closest("div");
  let username = parentDiv.data("user");
  msgPostId = parentDiv.data("postid");
  postUser.text(` ${username}`);
  messageDiv.toggle();
});

messageSubmit.on("click", function (e) {
  e.preventDefault();
  const message = content.val();
  const formMessage = {
    content: message,
  };
  sendMessage(msgPostId, formMessage);
});

messagesButton.on("click", function (e) {
  messagesSection.toggle();
});

logoutButton.on("click", function () {
  logout();
  isLoggedIn();
});

$(document).on("click", "button.edit", function (e) {
  let parentDiv = $(this).closest("div");
  editPostId = parentDiv.data("postid");
  let editPostTitle = parentDiv.data("post_title");
  let editPostPrice = parentDiv.data("post_price");
  let editPostDesc = parentDiv.data("post_desc");
  editTitle.attr("value", editPostTitle);
  editPrice.attr("value", editPostPrice);
  editDescription.text(editPostDesc);
  editDiv.toggle();
});

editSubmit.on("click", function (e) {
  e.preventDefault();
  const descriptionText = editDescription.val();
  const titleText = editTitle.val();
  const priceText = editPrice.val();
  const post = {
    title: titleText,
    description: descriptionText,
    price: priceText,
    willDeliver: true,
  };
  editPost(editPostId, post);
});

searchText.on("keyup", async function (e) {
  STATE.searchTerm = searchText.val();
  if (searchText.val().length > 0) {
    try {
      let match = await postMatches(STATE.searchTerm);
      if (match.length >= 1) {
        renderPostList(match);
      }
    } catch (error) {
      console.error(error);
    }
  } else {
    postingSection.empty();
    renderAllPosts();
  }
});

async function postMatches(text) {
  if (text) {
    text = text.toLowerCase();
    return STATE.POSTS.filter(function (post) {
      let searchTitle = post.title.toLowerCase();
      let searchDesc = post.description.toLowerCase();
      let searchUser = post.author.username.toLowerCase();
      if (
        searchTitle.includes(text) ||
        searchDesc.includes(text) ||
        searchUser.includes(text)
      ) {
        return post;
      }
    });
  }
}

function bootstrap() {
  isLoggedIn();
  postMatches();
}
bootstrap();
