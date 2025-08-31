const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase using Railway environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

const db = admin.firestore();
const app = express();

// Middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

// Routes
app.get('/', (req, res) => res.send('Backend is running!'));

app.post('/adexbackend', async (req, res) => {
  try {
    const { course, dept, regNm } = req.body;

    const courseRef = await db.collection(course).listDocuments();
    let dateArr = [];
    let classState = 0;
    let presentState = 0;

    for (const docRef of courseRef) dateArr.push(docRef.id);
    if (dateArr.length === 0)
      return res.status(404).json({ message: `No class held for ${course}` });

    for (const date of dateArr) {
      const student = await db
        .collection(course)
        .doc(date)
        .collection(dept)
        .doc(regNm)
        .get();

      classState++;
      if (student.exists) presentState++;
    }

    res.status(200).json({ dateArr, classState, presentState });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Listen on Railway port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
