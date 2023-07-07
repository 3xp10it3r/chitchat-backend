import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import UserList from "./dbUsers.js";
import topicList from "./dbTopics.js";
import bodyParser from "body-parser";
import Pusher from "pusher";
import cors from "cors";

const app = express();
const port = process.env.PORT || 4500;

const pusher = new Pusher({
  appId: "1441143",
  key: "92535eb2d8c741dfd29c",
  secret: "b94f2a3b28eda2661700",
  cluster: "ap2",
  useTLS: true,
});

//middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

//db config
const uri =
  "mongodb+srv://3xp10it3r:3xp10it3r@groupchatapp.2myuyo0.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.once("open", () => {
  console.log("db connected");

  const msgCollection = db.collection("messagecontents");
  const userCollection = db.collection("users");
  const topicCollection = db.collection("topics");

  const changeStream = msgCollection.watch();
  const changeUserStream = userCollection.watch();
  // const changeTopicStream = topicCollection.watch();

  changeStream.on("change", (change) => {
    console.log(change);

    if (change.operationType == "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.name,
        to: messageDetails.to,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("error triggering pusher");
    }
  });
  // changeTopicStream.on("change", (change) => {
  //   console.log(change);

  //   if (change.operationType == "insert") {
  //     const topicDetails = change.fullDocument;
  //     pusher.trigger("topics", "inserted", {
  //       topicName: topicDetails.topicName,
  //       userid: topicDetails.userid,
  //     });
  //   } else {
  //     console.log("error triggering pusher in topic");
  //   }
  // });
  changeUserStream.on("change", (change) => {
    if (change.operationType == "insert") {
      const userDetails = change.fullDocument;
      pusher.trigger("users", "inserted", {
        userid: userDetails.userid,
        username: userDetails.username,
        image: userDetails.image,
      });
    } else if (change.operationType == "update") {
      const userDetails = change.updateDescription.updatedFields;
      pusher.trigger("users", "updated", {
        username: userDetails?.username,
        image: userDetails?.image,
      });
    } else {
      console.log("not triggering pusher in user", change);
    }
  });
});

//api routes
app.get("/", (req, res) => res.status(200).send("hello world"));
// /api/v1

app.get("/messages/sync", (req, res) => {
  Messages.find((err, data) => {
    if (err) res.status(500).send(err);
    else res.status(200).send(data);
  });
});
app.get("/users/sync", (req, res) => {
  UserList.find((err, data) => {
    if (err) res.status(500).send(err);
    else res.status(200).send(data);
  });
});

app.get("/topics/sync", (req, res) => {
  topicList.find((err, data) => {
    if (err) res.status(500).send(err);
    else res.status(200).send(data);
  });
});
app.post("/messages/new", (req, res) => {
  const dbMessages = req.body;
  Messages.create(dbMessages, (err, data) => {
    if (err) res.status(500).send(err);
    else res.status(201).send(data);
  });
});

app.post("/user/new", (req, res) => {
  const dbUsers = req.body;

  UserList.create(dbUsers, (err, data) => {
    if (err) res.status(500).send(err);
    else res.status(201).send(data);
  });
});

app.post("/topic/new", (req, res) => {
  const dbTopics = req.body;

  topicList.create(dbTopics, (err, data) => {
    if (err) res.status(500).send(err);
    else res.status(201).send(data);
  });
});

app.post("/user/update/:uid", (req, res) => {
  const newData = {
    userid: req.body.userid,
    username: req.body.username,
    image: req.body.image,
  };

  UserList.findOneAndUpdate(
    { userid: req.params.uid },
    { $set: newData },
    { new: true }
  )
    .then((news) => res.json(news))
    .catch((error) => console.log(error));
});

app.post("/topic/update/:uid", (req, res) => {
  const newData = {
    topicName: req.body.topicName,
    userid: req.body.userid,
  };

  topicList
    .findOneAndUpdate(
      { userid: req.params.uid },
      { $set: newData },
      { new: true }
    )
    .then((news) => res.json(news))
    .catch((error) => console.log(error));
});

app.listen(port, () => console.log(`listening on localhost:${port}`));
