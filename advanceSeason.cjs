
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
try {
    admin.initializeApp();
} catch (e) {
    // Firebase already initialized
}
const db = admin.firestore();

function generateSchedule(clubIds, leagueId, season) {
    const clubs = [...clubIds];
    if (clubs.length % 2 !== 0) {
        clubs.push(null); // Dummy club for bye weeks
    }
    const numClubs = clubs.length;
    const numMatchdays = (numClubs - 1) * 2; // Home and away
    const halfMatchdays = numMatchdays / 2;

    const fixtures = [];
    const now = new Date();

    // HINRUNDE: Starts on the 3rd of the next month at 13:00
    const hinrundeStartDate = new Date(now.getFullYear(), now.getMonth() + 1, 3, 13, 0, 0, 0);

    // RÜCKRUNDE: Starts on the 20th of the same month at 13:00
    const rueckrundeStartDate = new Date(hinrundeStartDate.getFullYear(), hinrundeStartDate.getMonth(), 20, 13, 0, 0, 0);

    for (let matchday = 0; matchday < numMatchdays; matchday++) {
        let matchdayDate;

        if (matchday < halfMatchdays) { // Hinrunde: Daily matches
            matchdayDate = new Date(hinrundeStartDate);
            matchdayDate.setDate(hinrundeStartDate.getDate() + matchday);
        } else { // Rückrunde: Daily matches
            matchdayDate = new Date(rueckrundeStartDate);
            matchdayDate.setDate(rueckrundeStartDate.getDate() + (matchday - halfMatchdays));
        }

        for (let i = 0; i < numClubs / 2; i++) {
            const home = clubs[i];
            const away = clubs[numClubs - 1 - i];

            if (home && away) {
                let homeTeam, awayTeam;
                if (matchday < halfMatchdays) {
                    homeTeam = home;
                    awayTeam = away;
                } else {
                    homeTeam = away;
                    awayTeam = home;
                }

                fixtures.push({
                    leagueId: leagueId,
                    season: season,
                    matchday: matchday + 1,
                    date: matchdayDate.toISOString(),
                    homeTeam: homeTeam,
                    awayTeam: awayTeam,
                    status: 'scheduled',
                    result: null,
                });
            }
        }
        const lastClub = clubs.pop();
        clubs.splice(1, 0, lastClub);
    }
    return fixtures;
}

async function advanceSeason(leagueName) {
    if (!leagueName) {
        console.error("Please provide a league name to advance.");
        return;
    }

    console.log(`Starting season advancement for league: ${leagueName}...`);
    const batch = db.batch();

    try {
        const leagueQuery = await db.collection('leagues')
            .where('name', '==', leagueName)
            .orderBy('season', 'desc')
            .limit(1)
            .get();

        if (leagueQuery.empty) {
            console.error(`League "${leagueName}" not found.`);
            return;
        }

        const currentLeagueDoc = leagueQuery.docs[0];
        const currentLeague = { id: currentLeagueDoc.id, ...currentLeagueDoc.data() };
        console.log(`Found current season: ${currentLeague.season} (ID: ${currentLeague.id})`);

        batch.update(currentLeagueDoc.ref, { status: 'archived' });
        console.log(`Marking Season ${currentLeague.season} as archived.`);

        const newSeasonNumber = currentLeague.season + 1;
        const newLeagueData = {
            ...currentLeague,
            season: newSeasonNumber,
            status: 'active',
        };
        delete newLeagueData.id;

        const newLeagueRef = db.collection('leagues').doc();
        batch.set(newLeagueRef, newLeagueData);
        console.log(`Creating new Season ${newSeasonNumber} with new ID: ${newLeagueRef.id}`);

        const clubsSnapshot = await db.collection("clubs").where("leagueId", "==", currentLeague.id).get();
        const clubsToSchedule = clubsSnapshot.docs.map(d => d.id);
        
        console.log(`Found ${clubsToSchedule.length} clubs for the new season.`);

        if (clubsToSchedule.length > 0) {
            clubsToSchedule.forEach(clubId => {
                const clubRef = db.collection('clubs').doc(clubId);
                batch.update(clubRef, { leagueId: newLeagueRef.id });
            });
            console.log(`Updated ${clubsToSchedule.length} clubs to new league ID.`);
        }

        if (clubsToSchedule.length > 1) {
            console.log(`Generating schedule for ${clubsToSchedule.length} clubs with new date rules...`);
            const newFixtures = generateSchedule(clubsToSchedule, newLeagueRef.id, newSeasonNumber);
            newFixtures.forEach(fixture => {
                const fixtureRef = db.collection('fixtures').doc();
                batch.set(fixtureRef, fixture);
            });
            console.log(`Generated ${newFixtures.length} fixtures for the new season.`);
        } else {
            console.log("Not enough clubs to generate a schedule.");
        }
        
        await batch.commit();
        console.log("Season advancement complete. All changes have been committed.");

    } catch (error) {
        console.error("An error occurred during season advancement:", error);
    }
}

const leagueNameToAdvance = process.argv[2];
advanceSeason(leagueNameToAdvance);
