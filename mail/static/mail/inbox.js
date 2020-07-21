window.onload = function () {
  console.log("Clear the session Data to have inbox as default view on reloads");
  sessionStorage.setItem("load", null);
}
document.addEventListener('DOMContentLoaded', function () {
  console.log("Use buttons to toggle between views");
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  if (sessionStorage.getItem("load") == null || sessionStorage.getItem("load") == "null") {
    console.log("By default, load the inbox");
    load_mailbox('inbox');
  } else if (sessionStorage.getItem("load") == "reply") {
    console.log("Load Reply Content on Compose View");
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#mail-content-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    reply_content(sessionStorage.getItem("emailObject"));
  } else if (sessionStorage.getItem("load") == "sent") {
    console.log("Load Sent mailbox after sending from compose");
    load_mailbox('sent');
  } else {
    console.log("Load inbox by as  default view");
    document.querySelector('#compose-view').style.display = 'none';
    document.querySelector('#mail-content-view').style.display = 'none';
    document.querySelector('#emails-view').style.display = 'block';
  }
}, { once: true });

function compose_email() {
  console.log("Show compose view and hide other views");
  sessionStorage.setItem("load", null);
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#mail-content-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  console.log("Clear out compose fields");
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  document.querySelector('form').onsubmit = sendEmail;
}
function load_mailbox(mailbox) {
  console.log("Show the mailbox and hide other views");
  sessionStorage.setItem("load", null);
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail-content-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#h3').innerHTML = `${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}`;
  let url = "/emails/" + mailbox;
  fetch(url)
    .then(response => response.json())
    .then(emails => {
      populateMailBox(emails, mailbox);
      console.log(emails);
    });
}

function loadMailContent(id, mailtype) {
  console.log("Manage the Un/Archive and reply button visibility based on Mail Type");
  if (mailtype === "inbox") {
    document.querySelector('#reply').style.display = 'block';
    document.querySelector('#archive').style.display = 'block';
    document.querySelector('#unarchive').style.display = 'none';
  } else if (mailtype === "archive") {
    document.querySelector('#reply').style.display = 'none';
    document.querySelector('#archive').style.display = 'none';
    document.querySelector('#unarchive').style.display = 'block';
  } else {
    document.querySelector('#reply').style.display = 'none';
    document.querySelector('#archive').style.display = 'none';
    document.querySelector('#unarchive').style.display = 'none';
  }

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#mail-content-view').style.display = 'block';

  console.log("Load the content of the selected email with passed Id");
  let url = "/emails/" + id;
  fetch(url)
    .then(response => response.json())
    .then(email => {
      document.getElementById("mail-sender").value = email.sender;
      document.getElementById("mail-recipients").value = email.recipients;
      document.getElementById("mail-timestamp").value = email.timestamp;
      document.getElementById("mail-subject").value = email.subject;
      document.querySelector('#mail-body').innerHTML = email.body;
      console.log("Mark Email as Read");
      markEmailAsRead(id);
      document.querySelector('#archive').addEventListener('click', () => markEmailArchived(id, true));
      document.querySelector('#unarchive').addEventListener('click', () => markEmailArchived(id, false));
      document.querySelector('#reply').addEventListener('click', () => reply_email(email));
    });
}


function populateMailBox(mailList, mailType) {
  console.log("Populate mail box with mail content");
  var table = document.getElementById("mailbox");
  var rowCount = table.rows.length;
  for (var i = 1; i < rowCount; i++) {
    table.deleteRow(1);
  }
  mailList.forEach(function (item) {
    let newRow = table.insertRow();
    newRow.setAttribute("id", item.id, 0);
    let fromCell = newRow.insertCell(0);
    let fromText = document.createTextNode(item.sender);
    fromCell.appendChild(fromText);
    let subjectCell = newRow.insertCell(1);
    let subjectText = document.createTextNode(item.subject);
    subjectCell.appendChild(subjectText);
    let toCell = newRow.insertCell(2);
    let toText = document.createTextNode(item.timestamp);
    toCell.appendChild(toText);
    newRow.style.borderBottom = "thin solid";
    if (item.read) {
      newRow.style.backgroundColor = "#D3D3D3";
    } else {
      newRow.style.backgroundColor = "#FFFFFF";
    }
  });
  addRowHandlers(mailType);
}

function sendEmail() {
  console.log("Send an email");
  var recipient = document.getElementById("compose-recipients").value;
  var from = document.getElementById("compose-sender").value;
  var subject = document.getElementById("compose-subject").value;
  var body = document.getElementById("compose-body").value;
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipient,
      subject: subject,
      body: body
    })
  })
    .then(response => response.json())
    .then(result => {
      console.log('Sent Email Successfully!!!');
    })
    .catch(error => {
      console.log('Error while Sending an Email !!!');
    });
  sessionStorage.setItem("load", "sent");
}


function addRowHandlers(mailType) {
  console.log("Open a Content of an Email on click of any email");
  var table = document.getElementById("mailbox");
  var rows = table.getElementsByTagName("tr");
  for (i = 1; i < rows.length; i++) {
    var currentRow = table.rows[i];
    var createClickHandler = function (row) {
      return function () {
        loadMailContent(this.id, mailType);
      };
    };
    currentRow.onclick = createClickHandler(currentRow);
  }
}

function reply_email(emailObject) {
  console.log("Set the Reply data to session object to be used on domcontentLoader event");
  sessionStorage.setItem("load", "reply");
  sessionStorage.setItem("emailObject", JSON.stringify(emailObject));
}

function reply_content(emailObject) {
  console.log("Prepopulate reply email content and handle submission of reply");
  emailObject = JSON.parse(emailObject);
  document.querySelector('#heading').innerHTML = "Reply Email";
  document.querySelector('#compose-recipients').value = emailObject.sender;
  if (emailObject.subject.substring(0, 3) === "Re:") {
    document.querySelector('#compose-subject').value = emailObject.subject;
  } else {
    document.querySelector('#compose-subject').value = 'Re:' + emailObject.subject;
  }
  document.querySelector('#compose-body').value = "On  " + emailObject.timestamp + "   " + emailObject.sender + " wrote: " + "\n" + emailObject.body;
  sessionStorage.setItem("load", "reply");
  sessionStorage.setItem("emailObject", JSON.stringify(emailObject));
  document.querySelector('form').onsubmit = sendEmail;
}

function markEmailAsRead(emailId) {
  console.log("Mark the Email as Read");
  let url = "/emails/" + emailId;
  fetch(url, {
    method: 'PUT',
    body: JSON.stringify({
      read: true
    })
  })
}

//
function markEmailArchived(emailId, status) {
  console.log("Manage the Archive/Unarchive Toggle");
  let url = "/emails/" + emailId;
  fetch(url, {
    method: 'PUT',
    body: JSON.stringify({
      archived: status
    })
  })
}


