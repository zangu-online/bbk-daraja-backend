const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.boostyabankkenya,
    clientEmail: process.env.firebase-adminsdk-fbsvc@boostyabankkenya.iam.gserviceaccount.com,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  })
});

const db = admin.firestore();

module.exports = db;
