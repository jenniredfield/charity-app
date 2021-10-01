const AWS = require("aws-sdk");
const express = require("express");
const serverless = require("serverless-http");

const app = express();

const USERS_TABLE = process.env.USERS_TABLE;
const SERVICES_TABLE = process.env.SERVICES_TABLE;
const dynamoDbClientParams = {};
if (process.env.IS_OFFLINE) {
  dynamoDbClientParams.region = 'localhost'
  dynamoDbClientParams.endpoint = 'http://localhost:15003'
}
const dynamoDbClient = new AWS.DynamoDB.DocumentClient(dynamoDbClientParams);

app.use(express.json());

app.get("/users", async function (req, res) {
  const params = {
    TableName: USERS_TABLE
  };

  try {
    const items = await dynamoDbClient.scan(params).promise();
    console.log("🚀 ~ file: handler.js ~ line 24 ~ items", items)
    if (items) {
  
      res.json(items);
    } else {
      res
        .status(404)
        .json({ error: 'Could not find users' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive users" });
  }
});

app.get("/users/:userId", async function (req, res) {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  };

  try {
    const { Item } = await dynamoDbClient.get(params).promise();
    if (Item) {
      const { userId, name } = Item;
      res.json({ userId, name });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find user with provided "userId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive user" });
  }
});
// this will need to be private
app.post("/users", async function (req, res) {
  const { name, dob, email, telephone, type } = req.body;
  if (typeof name !== "string") {
    res.status(400).json({ error: '"name" must be a string' });
  }

  const userId = String(Date.now());

  const params = {
    TableName: USERS_TABLE,
    Item: {
      userId: userId,
      name: name,
      dob: dob,
      email: email,
      telephone: telephone,
      type: type
    },
  };

  try {
    const user = await dynamoDbClient.put(params).promise();
    console.log("🚀 ~ file: handler.js ~ line 84 ~ user", user)
    res.json({ userId, name,  dob, email, telephone, type});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create user" });
  }
});

app.post("/service", async function (req, res) {
  const { volunteerName, volunteerId, refugeeName, refugeeId, category, details } = req.body;
  if (typeof volunteerName !== "string") {
    res.status(400).json({ error: '"volunteerName" must be a string' });
  }

  const params = {
    TableName: SERVICES_TABLE,
    Item: {
      serviceId: String(Date.now()),
      volunteerName,
      volunteerId,
      refugeeName, 
      refugeeId, 
      category, 
      details,
      date: String(Date.now())
    },
  };

  try {
    await dynamoDbClient.put(params).promise();
    res.json({ volunteerName,  refugeeName, category, details });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not create service" });
  }
});


app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
