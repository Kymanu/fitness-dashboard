export const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TEMPLATE_TYPES = ['Push', 'Pull', 'Legs'];

export const DEFAULT_PROGRAM = {
  Push: {
    exercises: [
      { id: 'p1', name: 'BB Bench Press',       sets: 4, reps: '6–8',   lastWeight: 155 },
      { id: 'p2', name: 'DB Incline Press',      sets: 3, reps: '8–10',  lastWeight: 70  },
      { id: 'p3', name: 'DB Shoulder Press',     sets: 4, reps: '8–10',  lastWeight: 55  },
      { id: 'p4', name: 'Cable Flys',            sets: 3, reps: '12–15', lastWeight: 30  },
      { id: 'p5', name: 'Lateral Raises',        sets: 4, reps: '12–15', lastWeight: 27  },
      { id: 'p6', name: 'Tricep Pushdowns',      sets: 3, reps: '12–15', lastWeight: 45  },
      { id: 'p7', name: 'Overhead Tricep Ext',   sets: 3, reps: '10–12', lastWeight: 35  },
    ],
  },
  Pull: {
    exercises: [
      { id: 'q1', name: 'RDL',             sets: 4, reps: '8–10',  lastWeight: 185 },
      { id: 'q2', name: 'Pull Ups',        sets: 4, reps: '8–10',  lastWeight: 0   },
      { id: 'q3', name: 'Cable Row',       sets: 4, reps: '8–10',  lastWeight: 120 },
      { id: 'q4', name: 'Lat Pulldown',    sets: 3, reps: '10–12', lastWeight: 110 },
      { id: 'q5', name: 'DB Row',          sets: 3, reps: '10–12', lastWeight: 80  },
      { id: 'q6', name: 'Face Pulls',      sets: 3, reps: '15–20', lastWeight: 40  },
      { id: 'q7', name: 'Curls',           sets: 3, reps: '10–12', lastWeight: 35  },
      { id: 'q8', name: 'Hammer Curl',     sets: 3, reps: '10–12', lastWeight: 35  },
    ],
  },
  Legs: {
    exercises: [
      { id: 'l1', name: 'BB Squat',              sets: 4, reps: '6–8',   lastWeight: 185 },
      { id: 'l2', name: 'Leg Press',             sets: 4, reps: '8–10',  lastWeight: 270 },
      { id: 'l3', name: 'Romanian Deadlift',     sets: 3, reps: '8–10',  lastWeight: 155 },
      { id: 'l4', name: 'Leg Extension',         sets: 3, reps: '12–15', lastWeight: 110 },
      { id: 'l5', name: 'Leg Curl',              sets: 3, reps: '12–15', lastWeight: 90  },
      { id: 'l6', name: 'Walking Lunges',        sets: 3, reps: '12/leg',lastWeight: 40  },
      { id: 'l7', name: 'Standing Calf Raises',  sets: 4, reps: '15–20', lastWeight: 135 },
    ],
  },
};
