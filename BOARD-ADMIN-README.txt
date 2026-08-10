Board admin external script

Published URL after deployment:
https://syllogosmap.vercel.app/board-admin.js

Carrd board v1.2 uses this external file for:
- + button
- 2222 code
- edit existing terms
- add new term
- Firebase association_board sync

The + button opens before Firebase is initialized, so an Auth/Rules error
cannot prevent the admin modal from opening.
