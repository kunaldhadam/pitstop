from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.utils import timezone


def validate_listing_video(value):
    allowed_extensions = {".mp4", ".mov", ".webm"}
    extension = "." + value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
    if extension not in allowed_extensions:
        raise ValidationError("Upload an MP4, MOV, or WebM video.")
    if value.size > 50 * 1024 * 1024:
        raise ValidationError("Video files cannot exceed 50 MB.")


class ProductListing(models.Model):
    class ListingType(models.TextChoices):
        CAR = "car", "Car"
        BIKE = "bike", "Bike"
        SPARE_PART = "spare_part", "Spare Part"

    class Condition(models.TextChoices):
        NEW = "new", "New"
        USED = "used", "Used"
        REFURBISHED = "refurbished", "Refurbished"
        EXCELLENT = "excellent", "Excellent"
        GOOD = "good", "Good"
        NEEDS_WORK = "needs_work", "Needs Work"
        DAMAGED = "damaged", "Damaged"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending Review"
        ACTIVE = "active", "Active"
        PAUSED = "paused", "Paused"
        REJECTED = "rejected", "Rejected"
        SOLD = "sold", "Sold"
        EXPIRED = "expired", "Expired"
        DELETED = "deleted", "Deleted"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="product_listings",
    )
    listing_type = models.CharField(max_length=16, choices=ListingType.choices)
    title = models.CharField(max_length=160)
    description = models.TextField()
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    currency = models.CharField(max_length=3, default="AED")
    is_price_negotiable = models.BooleanField(default=False)
    location = models.CharField(max_length=160)
    condition = models.CharField(max_length=16, choices=Condition.choices)

    make = models.CharField(max_length=100, blank=True)
    model_name = models.CharField(max_length=100, blank=True)
    year = models.PositiveSmallIntegerField(null=True, blank=True)
    mileage_km = models.PositiveIntegerField(null=True, blank=True)
    fuel_type = models.CharField(max_length=32, blank=True)
    transmission = models.CharField(max_length=32, blank=True)
    color = models.CharField(max_length=48, blank=True)
    previous_owners = models.PositiveSmallIntegerField(null=True, blank=True)
    has_service_history = models.BooleanField(default=False)
    features = models.JSONField(default=list, blank=True)

    part_category = models.CharField(max_length=100, blank=True)
    part_subcategory = models.CharField(max_length=100, blank=True)
    part_name = models.CharField(max_length=160, blank=True)
    brand = models.CharField(max_length=100, blank=True)
    oem_part_number = models.CharField(max_length=100, blank=True)
    compatible_vehicles = models.JSONField(default=list, blank=True)
    quantity_available = models.PositiveIntegerField(null=True, blank=True)
    warranty_details = models.TextField(blank=True)
    return_policy = models.TextField(blank=True)
    video = models.FileField(
        upload_to="product_listings/videos/",
        blank=True,
        null=True,
        validators=[validate_listing_video],
    )

    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    moderation_note = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="reviewed_product_listings",
        null=True,
        blank=True,
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["listing_type", "status"]),
            models.Index(fields=["owner", "status"]),
        ]

    def __str__(self):
        return self.title

    @property
    def minimum_image_count(self):
        if self.listing_type == self.ListingType.SPARE_PART:
            return 3
        return 1

    def approve(self, reviewer):
        if self.status != self.Status.PENDING:
            raise ValidationError("Only pending listings can be approved.")
        if self.images.count() < self.minimum_image_count:
            raise ValidationError(
                f"Add at least {self.minimum_image_count} listing photos before approval."
            )

        now = timezone.now()
        self.status = self.Status.ACTIVE
        self.moderation_note = ""
        self.reviewed_by = reviewer
        self.reviewed_at = now
        self.approved_at = now
        self.save(
            update_fields=[
                "status",
                "moderation_note",
                "reviewed_by",
                "reviewed_at",
                "approved_at",
                "updated_at",
            ]
        )

    def reject(self, reviewer, note=""):
        if self.status != self.Status.PENDING:
            raise ValidationError("Only pending listings can be rejected.")

        self.status = self.Status.REJECTED
        self.moderation_note = note
        self.reviewed_by = reviewer
        self.reviewed_at = timezone.now()
        self.approved_at = None
        self.save(
            update_fields=[
                "status",
                "moderation_note",
                "reviewed_by",
                "reviewed_at",
                "approved_at",
                "updated_at",
            ]
        )


class ProductImage(models.Model):
    listing = models.ForeignKey(
        ProductListing,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(upload_to="product_listings/images/%Y/%m/")
    alt_text = models.CharField(max_length=160, blank=True)
    position = models.PositiveSmallIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "id"]

    def __str__(self):
        return f"Photo for {self.listing.title}"


class ListingInquiry(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "New"
        CONTACTED = "contacted", "Contacted"
        CLOSED = "closed", "Closed"

    listing = models.ForeignKey(
        ProductListing,
        on_delete=models.CASCADE,
        related_name="inquiries",
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="product_inquiries",
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_product_inquiries",
    )
    message = models.TextField(max_length=2000)
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.NEW,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["seller", "status"]),
            models.Index(fields=["buyer", "created_at"]),
        ]

    def __str__(self):
        return f"Inquiry for {self.listing.title} from {self.buyer}"


class ProductOrder(models.Model):
    class FulfillmentMethod(models.TextChoices):
        SHIPPING = "shipping", "Shipping"
        PICKUP = "pickup", "Pickup"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    listing = models.ForeignKey(
        ProductListing,
        on_delete=models.PROTECT,
        related_name="orders",
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="product_orders",
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_product_orders",
    )
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    fulfillment_method = models.CharField(
        max_length=8,
        choices=FulfillmentMethod.choices,
    )
    delivery_address = models.TextField(blank=True)
    status = models.CharField(
        max_length=12,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["buyer", "status"]),
            models.Index(fields=["seller", "status"]),
        ]

    def __str__(self):
        return f"Order for {self.listing.title} by {self.buyer}"

    @property
    def total_price(self):
        return self.unit_price * self.quantity

    def transition_to(self, new_status, actor):
        with transaction.atomic():
            order = (
                ProductOrder.objects.select_for_update()
                .select_related("listing")
                .get(pk=self.pk)
            )
            if order.status in (self.Status.COMPLETED, self.Status.CANCELLED):
                raise ValidationError("This order can no longer be changed.")

            if new_status == self.Status.CANCELLED:
                if actor.pk not in (order.buyer_id, order.seller_id):
                    raise ValidationError("You cannot update this order.")
                if actor.pk == order.buyer_id and order.status != self.Status.PENDING:
                    raise ValidationError("Only pending orders can be cancelled by the buyer.")
                listing = ProductListing.objects.select_for_update().get(
                    pk=order.listing_id
                )
                listing.quantity_available += order.quantity
                if (
                    listing.status == ProductListing.Status.SOLD
                    and listing.approved_at is not None
                ):
                    listing.status = ProductListing.Status.ACTIVE
                listing.save(update_fields=["quantity_available", "status", "updated_at"])
            elif actor.pk == order.seller_id:
                allowed_transitions = {
                    self.Status.PENDING: {self.Status.CONFIRMED},
                    self.Status.CONFIRMED: {self.Status.COMPLETED},
                }
                if new_status not in allowed_transitions.get(order.status, set()):
                    raise ValidationError("This order status transition is not allowed.")
            else:
                raise ValidationError("You cannot update this order.")

            order.status = new_status
            order.save(update_fields=["status", "updated_at"])
            self.status = order.status
            self.updated_at = order.updated_at
