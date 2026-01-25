"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase/app");
const functions_1 = require("firebase/functions");
const firebase_1 = require("./src/services/firebase");
// Initialize Firebase
const app = (0, app_1.initializeApp)(firebase_1.firebaseConfig);
const functions = (0, functions_1.getFunctions)(app);
const createLeague = (0, functions_1.httpsCallable)(functions, 'createLeague');
const run = async () => {
    console.log('Calling createLeague function...');
    try {
        const result = await createLeague();
        const data = result.data;
        if (data.success) {
            console.log('Success:', data.message);
        }
        else {
            console.error('Error:', data.message);
        }
    }
    catch (error) {
        console.error('An unexpected error occurred:', error);
    }
};
run();
