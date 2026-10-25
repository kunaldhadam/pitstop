# Products API

The API is mounted at `/api/products/`. Listing creation, inquiries, and orders
require an authenticated user. Both `individual` and `garage owner` accounts can
list cars, bikes, and spare parts.

## Demo listings

To populate the public catalog with repeatable sample cars, bikes, and spare
parts, run `python manage.py seed_demo_listings` from the backend directory.
The command creates two demo seller accounts, active demo listings, and
category artwork that meets the listing photo minimums; rerunning it does not
duplicate them. The sample accounts have unusable passwords and exist only to
attribute the showcase inventory.

## Listings

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET`, `POST` | `/listings/` | Browse active listings or submit a listing |
| `GET` | `/listings/mine/` | View the current user's listings; optionally filter with `?status=` |
| `GET`, `PATCH`, `DELETE` | `/listings/{id}/` | View, edit, or soft-delete a listing |
| `POST` | `/listings/{id}/actions/` | Pause, resume, or mark a listing sold |
| `DELETE` | `/listings/{id}/images/{image_id}/` | Remove a listing photo |
| `POST` (staff) | `/listings/{id}/moderate/` | Approve or reject a pending listing |

The public listing endpoint supports `listing_type`, `condition`, `make`,
`model`, `location`, `min_price`, `max_price`, and `search` query parameters.
New listings start as `pending` and are not publicly visible until approved.
An edit to an approved listing sends it back to `pending`. Resuming a paused
listing also requires approval.

Create listings with `multipart/form-data`; send each photo under the repeated
`images` field. Vehicle listings require at least one photo. Spare-part
listings require at least three photos, and either type accepts up to ten.
Video uploads are optional for used spare parts and accept MP4, MOV, or WebM
files up to 50 MB.

Common create fields are `listing_type`, `description`, `price`, `location`,
and `condition`. For cars and bikes, provide `make`, `model_name`, and `year`;
the title is generated from those fields if omitted. Spare parts require
`part_category`, `part_subcategory`, `part_name`, `brand`,
`compatible_vehicles`, and `quantity_available`. Compatibility is a JSON array
of objects with `make`, `model`, `year_from`, and `year_to`. For example:

```json
[
  {
    "make": "Toyota",
    "model": "Camry",
    "year_from": 2018,
    "year_to": 2022
  }
]
```

Prices are in AED. `is_price_negotiable` can be set for any listing. Available
listing statuses are `pending`, `active`, `paused`, `rejected`, `sold`, and
`expired`; deleting a listing changes its status to `deleted`.

## Vehicle inquiries

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET`, `POST` | `/inquiries/` | View inquiries involving the current user or inquire about an active car/bike |
| `GET`, `PATCH` | `/inquiries/{id}/` | View an inquiry or update its status as the seller |

Create an inquiry with `listing_id` and `message`. Sellers can move an inquiry
from `new` to `contacted` or `closed`, then from `contacted` to `closed`. This
records a lead; it does not create a live chat.

## Spare-part orders

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET`, `POST` | `/orders/` | View orders involving the current user or place a spare-part order |
| `GET`, `PATCH` | `/orders/{id}/` | View an order or advance its status |

Create an order with `listing_id`, `quantity`, and `fulfillment_method`
(`shipping` or `pickup`). Shipping requires `delivery_address`; pickup does
not. Creating an order reserves stock and records the unit-price snapshot.
Buyers can cancel pending orders; sellers can confirm or cancel pending orders
and complete confirmed orders. Cancellation restores stock.

Orders are a mock checkout record only: there is no payment gateway or delivery
fee calculation.
