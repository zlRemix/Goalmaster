
const { initializeApp } = require("firebase/app");
const { getFunctions, httpsCallable } = require("firebase/functions");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const { firebaseConfig } = require("./services/firebase");

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
const db = getFirestore(app);

const createLeague = httpsCallable(functions, 'createLeague');

const run = async () => {
    console.log('Fetching clubs...');
    try {
        const clubsCollection = collection(db, 'clubs');
        const clubsSnapshot = await getDocs(clubsCollection);
        const clubIds = clubsSnapshot.docs.map(doc => doc.id).slice(0, 10);

        if (clubIds.length < 2) {
            console.error('Error: Not enough clubs found to create a league. Need at least 2.');
            return;
        }

        console.log(`Calling createLeague function with ${clubIds.length} clubs...`);
        const result = await createLeague({ clubIds });
        const data = result.data;

        if (data.success) {
            console.log('Success:', data.message);
        } else {
            console.error('Error:', data.message);
        }
    } catch (error) {
        console.error('An unexpected error occurred:', error);
    }
};

run();
