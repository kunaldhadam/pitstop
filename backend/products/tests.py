import json
import tempfile
from io import BytesIO, StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from PIL import Image
from rest_framework.test import APITestCase

from .models import ListingInquiry, ProductImage, ProductListing, ProductOrder


class ProductsAPITests(APITestCase):
    def setUp(self):
        self.media_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.media_dir.cleanup)
        media_override = override_settings(MEDIA_ROOT=self.media_dir.name)
        media_override.enable()
        self.addCleanup(media_override.disable)

        self.user_model = get_user_model()
        self.seller = self.create_user("seller")
        self.buyer = self.create_user("buyer")
        self.moderator = self.create_user("moderator", is_staff=True)

    def create_user(self, username, is_staff=False, usertype="individual"):
        return self.user_model.objects.create_user(
            username=username,
            email=f"{username}@example.com",
            password="test-password",
            usertype=usertype,
            is_staff=is_staff,
        )

    def image_upload(self, name="part.png"):
        buffer = BytesIO()
        Image.new("RGB", (8, 8), color="white").save(buffer, format="PNG")
        return SimpleUploadedFile(
            name,
            buffer.getvalue(),
            content_type="image/png",
        )

    def create_car_listing(self, owner=None, status=ProductListing.Status.PENDING):
        listing = ProductListing.objects.create(
            owner=owner or self.seller,
            listing_type=ProductListing.ListingType.CAR,
            title="2020 Toyota Camry",
            description="Well-maintained vehicle.",
            price="85000.00",
            location="Dubai",
            condition=ProductListing.Condition.USED,
            make="Toyota",
            model_name="Camry",
            year=2020,
            status=status,
            approved_at=(
                timezone.now()
                if status == ProductListing.Status.ACTIVE
                else None
            ),
        )
        ProductImage.objects.create(listing=listing, image=self.image_upload())
        return listing

    def create_spare_part_listing(
        self,
        owner=None,
        status=ProductListing.Status.PENDING,
        quantity=2,
    ):
        listing = ProductListing.objects.create(
            owner=owner or self.seller,
            listing_type=ProductListing.ListingType.SPARE_PART,
            title="Front Brake Pad",
            description="New brake pads.",
            price="50.00",
            location="Dubai",
            condition=ProductListing.Condition.NEW,
            part_category="Brakes",
            part_subcategory="Brake Pads",
            part_name="Front Brake Pad",
            brand="Bosch",
            compatible_vehicles=[
                {
                    "make": "Toyota",
                    "model": "Camry",
                    "year_from": 2018,
                    "year_to": 2022,
                }
            ],
            quantity_available=quantity,
            status=status,
            approved_at=(
                timezone.now()
                if status == ProductListing.Status.ACTIVE
                else None
            ),
        )
        for _ in range(3):
            ProductImage.objects.create(listing=listing, image=self.image_upload())
        return listing

    def test_car_listing_creation_starts_pending_and_is_not_public(self):
        self.client.force_authenticate(self.seller)
        response = self.client.post(
            reverse("product-listings"),
            {
                "listing_type": "car",
                "description": "Well-maintained vehicle.",
                "price": "85000.00",
                "location": "Dubai",
                "condition": "used",
                "make": "Toyota",
                "model_name": "Camry",
                "year": "2020",
                "images": [self.image_upload()],
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201, response.data)
        listing = ProductListing.objects.get()
        self.assertEqual(listing.title, "2020 Toyota Camry")
        self.assertEqual(listing.status, ProductListing.Status.PENDING)
        self.assertEqual(listing.images.count(), 1)

        self.client.force_authenticate()
        public_response = self.client.get(reverse("product-listings"))
        self.assertEqual(public_response.status_code, 200)
        self.assertEqual(public_response.data, [])

    def test_garage_owner_can_create_a_vehicle_listing(self):
        garage_owner = self.create_user("garage", usertype="garage owner")
        self.client.force_authenticate(garage_owner)
        response = self.client.post(
            reverse("product-listings"),
            {
                "listing_type": "bike",
                "description": "Low-mileage commuter bike.",
                "price": "12000.00",
                "location": "Abu Dhabi",
                "condition": "used",
                "make": "Honda",
                "model_name": "CBR",
                "year": "2022",
                "images": [self.image_upload()],
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["seller"]["email"], garage_owner.email)
        listing = ProductListing.objects.get()
        self.assertEqual(listing.owner, garage_owner)
        self.assertEqual(listing.listing_type, ProductListing.ListingType.BIKE)

    def test_spare_part_requires_three_photos_and_lists_inventory_fields(self):
        self.client.force_authenticate(self.seller)
        payload = {
            "listing_type": "spare_part",
            "description": "New brake pads.",
            "price": "50.00",
            "location": "Dubai",
            "condition": "new",
            "part_category": "Brakes",
            "part_subcategory": "Brake Pads",
            "part_name": "Front Brake Pad",
            "brand": "Bosch",
            "compatible_vehicles": json.dumps(
                [
                    {
                        "make": "Toyota",
                        "model": "Camry",
                        "year_from": 2018,
                        "year_to": 2022,
                    }
                ]
            ),
            "quantity_available": "4",
        }
        too_few_photos = self.client.post(
            reverse("product-listings"),
            {**payload, "images": [self.image_upload()]},
            format="multipart",
        )
        self.assertEqual(too_few_photos.status_code, 400)
        self.assertIn("images", too_few_photos.data)
        self.assertEqual(ProductListing.objects.count(), 0)

        response = self.client.post(
            reverse("product-listings"),
            {
                **payload,
                "images": [
                    self.image_upload("front.png"),
                    self.image_upload("back.png"),
                    self.image_upload("label.png"),
                ],
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201, response.data)
        listing = ProductListing.objects.get()
        self.assertEqual(listing.title, "Front Brake Pad")
        self.assertEqual(listing.quantity_available, 4)
        self.assertEqual(listing.images.count(), 3)

    def test_admin_approval_and_owner_edit_return_listing_to_pending(self):
        listing = self.create_car_listing()
        self.client.force_authenticate(self.moderator)
        approval = self.client.post(
            reverse("product-listing-moderate", args=[listing.pk]),
            {"action": "approve"},
            format="json",
        )
        self.assertEqual(approval.status_code, 200, approval.data)
        listing.refresh_from_db()
        self.assertEqual(listing.status, ProductListing.Status.ACTIVE)
        self.assertEqual(listing.reviewed_by, self.moderator)

        self.client.force_authenticate(self.seller)
        update = self.client.patch(
            reverse("product-listing-detail", args=[listing.pk]),
            {"price": "82000.00"},
            format="json",
        )
        self.assertEqual(update.status_code, 200, update.data)
        listing.refresh_from_db()
        self.assertEqual(listing.price, 82000)
        self.assertEqual(listing.status, ProductListing.Status.PENDING)
        self.assertIsNone(listing.approved_at)

    def test_vehicle_inquiry_is_tracked_and_seller_can_update_it(self):
        listing = self.create_car_listing(status=ProductListing.Status.ACTIVE)
        self.client.force_authenticate(self.buyer)
        response = self.client.post(
            reverse("product-inquiries"),
            {"listing_id": listing.pk, "message": "Is this still available?"},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        inquiry = ListingInquiry.objects.get()
        self.assertEqual(inquiry.seller, self.seller)
        self.assertEqual(inquiry.buyer, self.buyer)
        self.assertEqual(inquiry.status, ListingInquiry.Status.NEW)

        self.client.force_authenticate(self.seller)
        update = self.client.patch(
            reverse("product-inquiry-detail", args=[inquiry.pk]),
            {"status": "contacted"},
            format="json",
        )
        self.assertEqual(update.status_code, 200, update.data)
        inquiry.refresh_from_db()
        self.assertEqual(inquiry.status, ListingInquiry.Status.CONTACTED)

    def test_removing_a_photo_from_an_approved_listing_requires_review(self):
        listing = self.create_spare_part_listing(status=ProductListing.Status.ACTIVE)
        ProductImage.objects.create(listing=listing, image=self.image_upload("extra.png"))
        photo = listing.images.first()

        self.client.force_authenticate(self.seller)
        response = self.client.delete(
            reverse(
                "product-listing-image-detail",
                args=[listing.pk, photo.pk],
            )
        )

        self.assertEqual(response.status_code, 204)
        listing.refresh_from_db()
        self.assertEqual(listing.images.count(), 3)
        self.assertEqual(listing.status, ProductListing.Status.PENDING)

    def test_demo_listings_command_is_repeatable_and_public(self):
        call_command("seed_demo_listings", stdout=StringIO())
        call_command("seed_demo_listings", stdout=StringIO())

        demo_listings = ProductListing.objects.filter(
            owner__username__startswith="showcase_"
        )
        self.assertEqual(demo_listings.count(), 8)
        self.assertEqual(
            demo_listings.filter(status=ProductListing.Status.ACTIVE).count(),
            8,
        )
        for listing in demo_listings:
            self.assertGreaterEqual(
                listing.images.count(),
                listing.minimum_image_count,
            )

        response = self.client.get(reverse("product-listings"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 8)
        self.assertTrue(all(listing["image_files"] for listing in response.data))

    def test_spare_part_order_reserves_stock_and_buyer_cancellation_restores_it(self):
        listing = self.create_spare_part_listing(status=ProductListing.Status.ACTIVE)
        self.client.force_authenticate(self.buyer)
        missing_address = self.client.post(
            reverse("product-orders"),
            {
                "listing_id": listing.pk,
                "quantity": 1,
                "fulfillment_method": "shipping",
            },
            format="json",
        )
        self.assertEqual(missing_address.status_code, 400)
        self.assertIn("delivery_address", missing_address.data)

        response = self.client.post(
            reverse("product-orders"),
            {
                "listing_id": listing.pk,
                "quantity": 2,
                "fulfillment_method": "shipping",
                "delivery_address": "Dubai Marina",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        order = ProductOrder.objects.get()
        self.assertEqual(order.total_price, 100)
        self.assertEqual(order.unit_price, 50)
        self.assertEqual(order.status, ProductOrder.Status.PENDING)
        listing.refresh_from_db()
        self.assertEqual(listing.quantity_available, 0)
        self.assertEqual(listing.status, ProductListing.Status.SOLD)

        cancellation = self.client.patch(
            reverse("product-order-detail", args=[order.pk]),
            {"status": "cancelled"},
            format="json",
        )
        self.assertEqual(cancellation.status_code, 200, cancellation.data)
        listing.refresh_from_db()
        self.assertEqual(listing.quantity_available, 2)
        self.assertEqual(listing.status, ProductListing.Status.ACTIVE)
