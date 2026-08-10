SEPSYG Map v6 — Therapist directory

The therapist list below the map is NOT a second database.

SOURCE OF TRUTH
---------------
Firebase project: syllogos-map
Collection: therapists

FLOW
----
+ on map -> save therapist to Firestore -> onSnapshot updates:
1. map pin
2. therapist count
3. therapist directory grouped by region

"Δείτε περισσότερα" in the directory calls the exact same showProfile(id,true)
function used by the map pin, so there is only one profile/popup implementation.

GROUPING
--------
Primary grouping: therapist.prefecture (map region)
Fallback when no prefecture was detected: therapist.area

Existing 1111 / 2222 permissions and Carrd auto-height remain unchanged.
