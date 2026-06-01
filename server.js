const db = require("./firebase");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const { getAccessToken } = require("./daraja");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// ====================================
// HOME
// ====================================

app.get("/", (req, res) => {
  res.send("BBK Daraja Server Running 🚀");
});

// ====================================
// CONFIRMATION CALLBACK
// ====================================

app.post("/confirmation", async (req, res) => {

  try {

    console.log(
      "Payment received:",
      JSON.stringify(req.body, null, 2)
    );

    const amount = Number(req.body.TransAmount);
    const transactionId = req.body.TransID;

    const depositsRef = db.collection("deposits");

    const snapshot = await depositsRef
      .where("status", "==", "pending")
      .where("amount", "==", amount)
      .limit(1)
      .get();

    if (snapshot.empty) {

      console.log("No matching deposit found");

      return res.json({
        ResultCode: 0,
        ResultDesc: "Accepted"
      });

    }

    const depositDoc = snapshot.docs[0];
    const deposit = depositDoc.data();

    const email = deposit.email;

console.log("Deposit email:", email);

const users = await db
  .collection("users")
  .where("email", "==", email)
  .get();

console.log("Users found:", users.size);

    if (users.empty) {

      console.log("User not found");

      return res.json({
        ResultCode: 0,
        ResultDesc: "Accepted"
      });

    }

    const userDoc = users.docs[0];
    const userData = userDoc.data();

    const currentBalance =
      Number(userData.balance || 0);

    const currentDeposited =
      Number(userData.totalDeposited || 0);

    await userDoc.ref.update({

      balance: currentBalance + amount,

      totalDeposited:
        currentDeposited + amount

    });

    await depositDoc.ref.update({

      status: "completed",

      transactionId: transactionId

    });

    console.log(
      `Credited ${email} with KSh ${amount}`
    );

    res.json({
      ResultCode: 0,
      ResultDesc: "Accepted"
    });

  } catch (error) {

    console.log(error);

    res.json({
      ResultCode: 0,
      ResultDesc: "Accepted"
    });

  }

});

// ====================================
// VALIDATION CALLBACK
// ====================================

app.post("/validation", (req, res) => {

  res.json({
    ResultCode: 0,
    ResultDesc: "Accepted"
  });

});

// ====================================
// REGISTER URLS
// ====================================

app.get("/register-urls", async (req, res) => {

  try {

    const token = await getAccessToken();

    const response = await axios.post(
      `${process.env.BASE_URL}/mpesa/c2b/v1/registerurl`,
      {
        ShortCode: "600000",
        ResponseType: "Completed",
        ConfirmationURL:
          "https://sauciness-strangle-commotion.ngrok-free.dev/confirmation",
        ValidationURL:
          "https://sauciness-strangle-commotion.ngrok-free.dev/validation"
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    res.json(response.data);

  } catch (error) {

    console.log(
      error.response?.data || error.message
    );

    res.status(500).json(
      error.response?.data || error.message
    );

  }

});

// ====================================
// START SERVER
// ====================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
