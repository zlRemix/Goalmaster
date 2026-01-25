// Cache-Busting-Kommentar
import { EquipmentItem, EquipmentSlot } from "../types";

export const EQUIPMENT_ITEMS: EquipmentItem[] = [
    // --- Schuhe (Stürmer) ---
    {
        id: 'shoe_st_01',
        name: 'Stürmer-Schuh Alpha',
        description: 'Verbessert Schusskraft und Abschluss.',
        price: 50,
        slot: EquipmentSlot.SHOES,
        allowedPositions: ['Stürmer'],
        bonus: { 
            'shot_power': 2,
            'finishing': 3,
        }
    },
    // --- Schuhe (Mittelfeld) ---
    {
        id: 'shoe_mf_01',
        name: 'Mittelfeld-Schuh Beta',
        description: 'Verbessert Passen und Dribbling.',
        price: 50,
        slot: EquipmentSlot.SHOES,
        allowedPositions: ['Mittelfeld'],
        bonus: {
            'passing': 3,
            'dribbling': 2,
        }
    },
    // --- Schuhe (Abwehr) ---
    {
        id: 'shoe_aw_01',
        name: 'Abwehr-Schuh Gamma',
        description: 'Verbessert Zweikampf und Stärke.',
        price: 50,
        slot: EquipmentSlot.SHOES,
        allowedPositions: ['Abwehr'],
        bonus: {
            'tackling': 3,
            'strength': 2,
        }
    },
    // --- Handschuhe (Torwart) ---
    {
        id: 'glove_tw_01',
        name: 'Torwart-Handschuh Titan',
        description: 'Verbessert Fangen und Reflexe.',
        price: 60,
        slot: EquipmentSlot.GLOVES,
        allowedPositions: ['Torwart'],
        bonus: {
            'handling': 3,
            'reflexes': 2,
        }
    },
];