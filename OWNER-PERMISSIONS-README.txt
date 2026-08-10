SEPSYG Map v5 — ownership permissions

ACCESS
------
1111 = therapist / creator mode
- can create a new therapist profile
- can edit/delete only therapist records whose owner_uid matches the
  current Firebase anonymous-auth user

2222 = super-admin mode
- can create
- can edit/delete any therapist from the interface

NEW RECORDS
-----------
Every newly created therapist document receives:
owner_uid: <Firebase anonymous auth uid>

EXISTING RECORDS
----------------
Old therapist documents created before this feature do not contain owner_uid.
They are therefore editable/deletable only with 2222.

DEVICE / BROWSER NOTE
---------------------
Firebase anonymous auth persists the ownership identity in that browser/site
storage. If a therapist switches browser/device or clears site data, the app
cannot automatically prove that they are the original owner. 2222 can still
manage the record.

SECURITY NOTE
-------------
The map remains a static client-side application. The 2222 code controls the
interface but is not a production-grade secret because client JavaScript can
be inspected. Strong server-enforced admin security would require moving
2222 verification and admin mutations to a server/API.
