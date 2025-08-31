const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const admin = require('firebase-admin');
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  })
});

const db = admin.firestore();
const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors())
const PORT = process.env.PORT || 3001;

app.post('/adexbackend', async (req, res) => {
  try {
    const { course, dept, regNm } = req.body;

    const courseRef = await db.collection(course).listDocuments();
    let dateArr = [];
    let classState = 0;
    let presentState = 0;

    for (const docRef of courseRef) {
      dateArr.push(docRef.id);
    }

    if (dateArr.length <= 0) {
      return res.status(404).send({ message: `No class held for ${course}` });
    }

    for (const date of dateArr) {
      const student = await db
        .collection(course)
        .doc(date)
        .collection(dept)
        .doc(regNm)
        .get();

      classState++;
      if (student.exists) {
        presentState++;
      }
    }

    res.status(200).json({ dateArr, classState, presentState });

  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Now running on http://localhost:${PORT}`);
});
