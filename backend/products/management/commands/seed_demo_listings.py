from io import BytesIO
from math import cos, pi, sin

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone
from PIL import Image, ImageDraw

from accounts.models import GarageOwnerProfile
from products.models import ProductImage, ProductListing


DEMO_SELLERS = (
    {
        "username": "showcase_individual",
        "email": "individual@example.test",
        "usertype": "individual",
    },
    {
        "username": "showcase_garage",
        "email": "garage@example.test",
        "usertype": "garage owner",
    },
)

DEMO_LISTINGS = (
    {
        "owner": "showcase_individual",
        "listing_type": ProductListing.ListingType.CAR,
        "title": "2021 Toyota Land Cruiser GXR",
        "description": "Single-owner SUV with full service history and a clean inspection.",
        "price": "248000.00",
        "location": "Dubai",
        "condition": ProductListing.Condition.USED,
        "make": "Toyota",
        "model_name": "Land Cruiser GXR",
        "year": 2021,
        "mileage_km": 42000,
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "color": "Pearl White",
        "previous_owners": 1,
        "has_service_history": True,
        "features": ["Sunroof", "360 camera", "Leather seats"],
    },
    {
        "owner": "showcase_garage",
        "listing_type": ProductListing.ListingType.CAR,
        "title": "2022 BMW 530i M Sport",
        "description": "Well-kept M Sport sedan inspected by our garage team.",
        "price": "189500.00",
        "location": "Abu Dhabi",
        "condition": ProductListing.Condition.EXCELLENT,
        "make": "BMW",
        "model_name": "530i M Sport",
        "year": 2022,
        "mileage_km": 28500,
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "color": "Black",
        "previous_owners": 1,
        "has_service_history": True,
        "features": ["Parking sensors", "Adaptive cruise control"],
    },
    {
        "owner": "showcase_individual",
        "listing_type": ProductListing.ListingType.CAR,
        "title": "2020 Lexus ES 350",
        "description": "Comfortable, low-mileage sedan available for viewing in Sharjah.",
        "price": "137000.00",
        "location": "Sharjah",
        "condition": ProductListing.Condition.GOOD,
        "make": "Lexus",
        "model_name": "ES 350",
        "year": 2020,
        "mileage_km": 51000,
        "fuel_type": "Petrol",
        "transmission": "Automatic",
        "color": "Silver",
        "previous_owners": 2,
        "has_service_history": True,
        "features": ["Leather seats", "Rear camera"],
    },
    {
        "owner": "showcase_garage",
        "listing_type": ProductListing.ListingType.BIKE,
        "title": "2023 Honda CB650R",
        "description": "Workshop-serviced naked bike in excellent riding condition.",
        "price": "32500.00",
        "location": "Dubai",
        "condition": ProductListing.Condition.EXCELLENT,
        "make": "Honda",
        "model_name": "CB650R",
        "year": 2023,
        "mileage_km": 8400,
        "fuel_type": "Petrol",
        "transmission": "Manual",
        "color": "Matte Black",
        "previous_owners": 1,
        "has_service_history": True,
        "features": ["ABS", "Service history"],
    },
    {
        "owner": "showcase_individual",
        "listing_type": ProductListing.ListingType.BIKE,
        "title": "2021 Yamaha MT-07",
        "description": "Lightweight road bike with recent tyres and maintenance.",
        "price": "24900.00",
        "location": "Abu Dhabi",
        "condition": ProductListing.Condition.GOOD,
        "make": "Yamaha",
        "model_name": "MT-07",
        "year": 2021,
        "mileage_km": 17600,
        "fuel_type": "Petrol",
        "transmission": "Manual",
        "color": "Blue",
        "previous_owners": 1,
        "has_service_history": True,
        "features": ["ABS"],
    },
    {
        "owner": "showcase_garage",
        "listing_type": ProductListing.ListingType.SPARE_PART,
        "title": "Bosch Front Brake Pad Set",
        "description": "New front brake pad set with manufacturer warranty.",
        "price": "385.00",
        "location": "Dubai",
        "condition": ProductListing.Condition.NEW,
        "part_category": "Brakes",
        "part_subcategory": "Brake Pads",
        "part_name": "Front Brake Pad Set",
        "brand": "Bosch",
        "oem_part_number": "BP-4402",
        "compatible_vehicles": [
            {"make": "Toyota", "model": "Land Cruiser", "year_from": 2018, "year_to": 2023}
        ],
        "quantity_available": 8,
        "warranty_details": "12-month manufacturer warranty.",
        "return_policy": "Returns accepted within 14 days if unused.",
    },
    {
        "owner": "showcase_garage",
        "listing_type": ProductListing.ListingType.SPARE_PART,
        "title": "Michelin Primacy 4 Tyre",
        "description": "New 235/55 R19 tyre, available for local pickup.",
        "price": "620.00",
        "location": "Abu Dhabi",
        "condition": ProductListing.Condition.NEW,
        "part_category": "Tyres & Wheels",
        "part_subcategory": "Tyres",
        "part_name": "Primacy 4 235/55 R19",
        "brand": "Michelin",
        "oem_part_number": "MI-2355519",
        "compatible_vehicles": [],
        "quantity_available": 12,
        "warranty_details": "Manufacturer warranty included.",
        "return_policy": "Returns accepted within 14 days if unused.",
    },
    {
        "owner": "showcase_individual",
        "listing_type": ProductListing.ListingType.SPARE_PART,
        "title": "Genuine BMW 5 Series Air Filter",
        "description": "Unused genuine replacement air filter, boxed and ready to ship.",
        "price": "145.00",
        "location": "Sharjah",
        "condition": ProductListing.Condition.NEW,
        "part_category": "Filters",
        "part_subcategory": "Air Filters",
        "part_name": "Engine Air Filter",
        "brand": "BMW",
        "oem_part_number": "BMW-13718511668",
        "compatible_vehicles": [
            {"make": "BMW", "model": "5 Series", "year_from": 2017, "year_to": 2023}
        ],
        "quantity_available": 3,
        "warranty_details": "",
        "return_policy": "Returns accepted within 7 days if unused.",
    },
)


def make_demo_image(listing, photo_number):
    palettes = {
        ProductListing.ListingType.CAR: ((248, 239, 215), (37, 48, 63)),
        ProductListing.ListingType.BIKE: ((222, 236, 231), (42, 70, 63)),
        ProductListing.ListingType.SPARE_PART: ((225, 234, 246), (50, 71, 101)),
    }
    background, foreground = palettes[listing.listing_type]
    image = Image.new("RGB", (960, 540), background)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((38, 38, 922, 502), radius=42, fill=(255, 255, 255))

    if listing.listing_type == ProductListing.ListingType.CAR:
        draw.polygon(
            [(142, 349), (207, 254), (352, 190), (615, 190), (744, 276), (825, 315), (849, 389), (119, 389)],
            fill=foreground,
        )
        draw.polygon(
            [(253, 259), (370, 211), (485, 211), (485, 280)],
            fill=(191, 208, 217),
        )
        draw.polygon(
            [(504, 211), (604, 211), (702, 280), (504, 280)],
            fill=(191, 208, 217),
        )
        for center_x in (280, 700):
            draw.ellipse((center_x - 61, 340, center_x + 61, 462), fill=(35, 38, 43))
            draw.ellipse((center_x - 30, 371, center_x + 30, 431), fill=(206, 211, 210))
    elif listing.listing_type == ProductListing.ListingType.BIKE:
        draw.ellipse((196, 274, 378, 456), outline=foreground, width=20)
        draw.ellipse((591, 274, 773, 456), outline=foreground, width=20)
        draw.line([(287, 365), (411, 270), (505, 365), (287, 365)], fill=foreground, width=22)
        draw.line([(411, 270), (620, 365), (505, 365)], fill=foreground, width=22)
        draw.line([(411, 270), (456, 226), (535, 226)], fill=foreground, width=22)
        draw.line([(620, 365), (685, 243), (739, 243)], fill=foreground, width=18)
        draw.line([(287, 365), (262, 236), (214, 236)], fill=foreground, width=18)
        draw.line([(380, 264), (448, 264)], fill=foreground, width=20)
    else:
        points = [
            (
                480 + int((198 if index % 2 == 0 else 165) * cos(index * pi / 6)),
                280 + int((198 if index % 2 == 0 else 165) * sin(index * pi / 6)),
            )
            for index in range(12)
        ]
        draw.polygon(points, fill=foreground)
        draw.ellipse((408, 208, 552, 352), fill=(255, 255, 255))
        draw.ellipse((452, 252, 508, 308), fill=(199, 211, 226))

    draw.rounded_rectangle((58, 420, 902, 476), radius=18, fill=foreground)
    draw.text((82, 437), f"DEMO LISTING  |  IMAGE {photo_number}", fill=(255, 255, 255))
    buffer = BytesIO()
    image.save(buffer, format="PNG")
    return ContentFile(buffer.getvalue(), name=f"demo-{listing.pk}-{photo_number}.png")


class Command(BaseCommand):
    help = "Create repeatable active demo listings for the buy/sell showcase."

    def handle(self, *args, **options):
        user_model = get_user_model()
        sellers = {}
        for seller_data in DEMO_SELLERS:
            username = seller_data["username"]
            seller, created = user_model.objects.get_or_create(
                username=username,
                defaults={
                    "email": seller_data["email"],
                    "usertype": seller_data["usertype"],
                    "is_active": True,
                },
            )
            if created:
                seller.set_unusable_password()
                seller.save(update_fields=["password"])
            sellers[username] = seller

        garage = sellers["showcase_garage"]
        GarageOwnerProfile.objects.get_or_create(
            user=garage,
            defaults={"business_name": "Pitstop Demo Garage"},
        )

        created_count = 0
        for listing_data in DEMO_LISTINGS:
            data = listing_data.copy()
            owner = sellers[data.pop("owner")]
            now = timezone.now()
            listing, created = ProductListing.objects.get_or_create(
                owner=owner,
                title=data["title"],
                defaults={
                    **data,
                    "status": ProductListing.Status.ACTIVE,
                    "approved_at": now,
                    "reviewed_at": now,
                },
            )
            if created:
                created_count += 1
            image_count = listing.images.count()
            for photo_number in range(
                image_count + 1,
                listing.minimum_image_count + 1,
            ):
                ProductImage.objects.create(
                    listing=listing,
                    image=make_demo_image(listing, photo_number),
                    alt_text=f"Illustration for {listing.title}",
                    position=photo_number - 1,
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Demo listings ready: {created_count} created, "
                f"{len(DEMO_LISTINGS) - created_count} already present."
            )
        )
