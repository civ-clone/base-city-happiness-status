# base-city-happiness-status

Keeps a city's status, such as being in disorder or celebrating, from one turn to the next and in the save. Each status
is a `core-pending-effect` `PendingEffect` on the city, named by the ruleset's own handler id, so the save records it:

- `lib/cityStatus`:
  - `cityStatus(handler, city, pendingEffects?)`: the city's recorded status, or `null`. Read before this turn's
    update, it's the status carried over from the last turn (a second turn of disorder, a celebration that goes on).
  - `updateCityStatus(handler, city, active, recorded, pendingEffects?, onStart?)`: records a status that has started
    (calling `onStart` first) and ends one that has stopped.
  - `registerCityStatusHandler(handler, event, pendingEffects?, engine?)`: emits `event` with the city when its status
    ends. Register it when the rules are created, so a status loaded from a save can still end.
  - `forgetCityStatuses(city, handlers, pendingEffects?)`: drops statuses without ending them, for a city that's gone.
- `lib/statusTurn`: `cityStatusTurn(cities, options)` checks each city's `CivilDisorder` and `CelebrateLeader` rules
  on one set of yields, emits `city:civil-disorder` and `city:leader-celebration`, and records or ends both statuses.
  The ruleset passes its handlers and its own turns of the rule through hooks: `onDisorderContinues` (a second turn of
  disorder, such as a Democracy falling), `onCelebrationChecked` (with whether the city celebrates again, for growth),
  `forgetCelebration` (drop rather than end) and `celebrationSurvivesDisorder`.

A library: it registers no rules. See `civ1-city-happiness` for Civilization's civil disorder and "We Love the King
Day".
