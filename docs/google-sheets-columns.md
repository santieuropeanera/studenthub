# Google Sheets Catalog Columns

Use the Google Sheet named `source` in the Google Drive folder `Database / StudentHub`.

Do not repeat catalog addresses in student rows. Students should use the real work placement and accommodation names.

## Tab: work placements

| Column | Required | Notes |
| --- | --- | --- |
| external_key | Yes | Internal stable ID used by the sync |
| name | Yes | Work placement name |
| address | Yes | Work placement address |
| working_hours | No | Example: Monday to Friday, 09:00 - 14:00 |

## Tab: hospitals

| Column | Required | Notes |
| --- | --- | --- |
| external_key | Yes | Stable ID used by accommodation rows |
| name | Yes | Hospital or medical center name |
| address | Yes | Hospital or medical center address |

## Tab: accommodation

| Column | Required | Notes |
| --- | --- | --- |
| external_key | Yes | Internal stable ID used by the sync |
| name | Yes | Accommodation name |
| address | Yes | Accommodation address |
| emergency_phone | No | Accommodation emergency phone |
| hospital_external_key | Yes | Must match `external_key` in the `hospitals` tab |

## Tab: students

Required columns:

| Column | Required | Notes |
| --- | --- | --- |
| full_name | Yes | Student or teacher full name |
| email | Yes | Must be a valid email |
| role | Yes | `student` or `teacher` |
| school_name | Yes | School name |
| group_name | Yes | Mobility group name |
| work_placement_name | For students | Must exactly match `name` in `work placements`; teachers can leave empty |
| working_hours | For students | Human-readable hours; teachers can leave empty |
| accommodation_name | For students | Must exactly match `name` in `accommodation`; teachers can leave empty |

The app will derive:

- Work placement address from `work placements`
- Accommodation address and emergency phone from `accommodation`
- Assigned hospital from `accommodation.hospital_external_key`
- Hospital address from `hospitals`

External keys stay internal to catalog tabs. Students and teachers should see real names, not external keys.
