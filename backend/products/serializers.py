from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import ListingInquiry, ProductImage, ProductListing, ProductOrder


def user_contact(user):
    garage_profile = getattr(user, "garage_owner_profile", None)
    return {
        "name": (
            garage_profile.business_name
            if garage_profile
            else user.get_full_name() or user.username
        ),
        "account_type": user.usertype,
        "email": user.email,
        "phone_number": user.phone_number,
        "vat_gst_number": garage_profile.vat_gst_number if garage_profile else None,
    }


class UploadedImageListField(serializers.ListField):
    def get_value(self, dictionary):
        getlist = getattr(dictionary, "getlist", None)
        if getlist:
            values = getlist(self.field_name)
            if values:
                return values
        return super().get_value(dictionary)


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "position", "uploaded_at"]
        read_only_fields = fields


class ProductListingSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductListing
        fields = [
            "id",
            "listing_type",
            "title",
            "price",
            "currency",
            "location",
            "status",
        ]
        read_only_fields = fields


class ProductListingSerializer(serializers.ModelSerializer):
    images = UploadedImageListField(
        child=serializers.ImageField(),
        required=False,
        write_only=True,
        max_length=10,
    )
    image_files = ProductImageSerializer(
        source="images",
        many=True,
        read_only=True,
    )
    owner_id = serializers.IntegerField(read_only=True)
    seller = serializers.SerializerMethodField()

    class Meta:
        model = ProductListing
        fields = [
            "id",
            "owner_id",
            "seller",
            "listing_type",
            "title",
            "description",
            "price",
            "currency",
            "is_price_negotiable",
            "location",
            "condition",
            "make",
            "model_name",
            "year",
            "mileage_km",
            "fuel_type",
            "transmission",
            "color",
            "previous_owners",
            "has_service_history",
            "features",
            "part_category",
            "part_subcategory",
            "part_name",
            "brand",
            "oem_part_number",
            "compatible_vehicles",
            "quantity_available",
            "warranty_details",
            "return_policy",
            "video",
            "images",
            "image_files",
            "status",
            "moderation_note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "owner_id",
            "seller",
            "currency",
            "status",
            "moderation_note",
            "image_files",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "title": {"required": False, "allow_blank": True},
            "features": {"required": False},
            "compatible_vehicles": {"required": False},
            "quantity_available": {"required": False, "allow_null": True},
        }

    def get_seller(self, listing):
        return user_contact(listing.owner)

    def validate(self, attrs):
        listing_type = attrs.get(
            "listing_type",
            self.instance.listing_type if self.instance else None,
        )
        if self.instance and listing_type != self.instance.listing_type:
            raise serializers.ValidationError(
                {"listing_type": "The listing category cannot be changed."}
            )

        owner = (
            self.context["request"].user
            if self.context.get("request")
            else getattr(self.instance, "owner", None)
        )
        if not self.instance and owner and owner.usertype not in (
            "individual",
            "garage owner",
        ):
            raise serializers.ValidationError(
                {"owner": "Only individual and garage owner accounts can list products."}
            )

        if listing_type in (
            ProductListing.ListingType.CAR,
            ProductListing.ListingType.BIKE,
        ):
            self._require_fields(
                attrs,
                ("make", "model_name", "year", "location", "condition"),
            )
            year = attrs.get("year", getattr(self.instance, "year", None))
            if year and year > timezone.now().year + 1:
                raise serializers.ValidationError(
                    {"year": "Enter a valid model year."}
                )
            condition = attrs.get(
                "condition",
                getattr(self.instance, "condition", None),
            )
            if condition not in {
                ProductListing.Condition.NEW,
                ProductListing.Condition.USED,
                ProductListing.Condition.EXCELLENT,
                ProductListing.Condition.GOOD,
                ProductListing.Condition.NEEDS_WORK,
                ProductListing.Condition.DAMAGED,
            }:
                raise serializers.ValidationError(
                    {"condition": "Choose a valid vehicle condition."}
                )
            if not attrs.get("title") and not self.instance:
                attrs["title"] = " ".join(
                    str(value)
                    for value in (year, attrs.get("make"), attrs.get("model_name"))
                    if value
                )
        elif listing_type == ProductListing.ListingType.SPARE_PART:
            self._require_fields(
                attrs,
                (
                    "part_category",
                    "part_subcategory",
                    "part_name",
                    "brand",
                    "location",
                    "condition",
                    "quantity_available",
                ),
            )
            compatible_vehicles = attrs.get(
                "compatible_vehicles",
                getattr(self.instance, "compatible_vehicles", []),
            )
            if not compatible_vehicles:
                raise serializers.ValidationError(
                    {"compatible_vehicles": "Add at least one compatible vehicle."}
                )
            if not isinstance(compatible_vehicles, list) or any(
                not isinstance(vehicle, dict)
                or not all(
                    vehicle.get(field)
                    for field in ("make", "model", "year_from", "year_to")
                )
                for vehicle in compatible_vehicles
            ):
                raise serializers.ValidationError(
                    {
                        "compatible_vehicles": (
                            "Each compatible vehicle needs make, model, "
                            "year_from, and year_to."
                        )
                    }
                )
            normalized_vehicles = []
            for vehicle in compatible_vehicles:
                try:
                    year_from = int(vehicle["year_from"])
                    year_to = int(vehicle["year_to"])
                except (TypeError, ValueError):
                    raise serializers.ValidationError(
                        {
                            "compatible_vehicles": (
                                "Compatible vehicle years must be valid years."
                            )
                        }
                    ) from None
                if (
                    year_from < 1886
                    or year_from > year_to
                    or year_to > timezone.now().year + 1
                ):
                    raise serializers.ValidationError(
                        {
                            "compatible_vehicles": (
                                "Enter a valid compatible vehicle year range."
                            )
                        }
                    )
                normalized_vehicles.append(
                    {
                        **vehicle,
                        "year_from": year_from,
                        "year_to": year_to,
                    }
                )
            if "compatible_vehicles" in attrs:
                attrs["compatible_vehicles"] = normalized_vehicles
            condition = attrs.get(
                "condition",
                getattr(self.instance, "condition", None),
            )
            if condition not in {
                ProductListing.Condition.NEW,
                ProductListing.Condition.USED,
                ProductListing.Condition.REFURBISHED,
            }:
                raise serializers.ValidationError(
                    {"condition": "Choose a valid spare-part condition."}
                )
            if not attrs.get("title") and not self.instance:
                attrs["title"] = attrs["part_name"]
        else:
            raise serializers.ValidationError(
                {"listing_type": "Choose car, bike, or spare_part."}
            )

        title = attrs.get("title", getattr(self.instance, "title", ""))
        if not title.strip():
            raise serializers.ValidationError({"title": "This field is required."})

        uploaded_images = attrs.get("images", [])
        current_image_count = self.instance.images.count() if self.instance else 0
        total_image_count = current_image_count + len(uploaded_images)
        if self.instance is None and total_image_count < self._minimum_images(listing_type):
            raise serializers.ValidationError(
                {
                    "images": (
                        f"Upload at least {self._minimum_images(listing_type)} "
                        "listing photos."
                    )
                }
            )
        if total_image_count > 10:
            raise serializers.ValidationError(
                {"images": "A listing can have no more than 10 photos."}
            )

        video = attrs.get("video")
        condition = attrs.get(
            "condition",
            getattr(self.instance, "condition", None),
        )
        if video and not (
            listing_type == ProductListing.ListingType.SPARE_PART
            and condition == ProductListing.Condition.USED
        ):
            raise serializers.ValidationError(
                {"video": "Video uploads are only available for used spare parts."}
            )

        return attrs

    @staticmethod
    def _minimum_images(listing_type):
        if listing_type == ProductListing.ListingType.SPARE_PART:
            return 3
        return 1

    def _require_fields(self, attrs, field_names):
        missing = [
            field_name
            for field_name in field_names
            if attrs.get(
                field_name,
                getattr(self.instance, field_name, None),
            )
            in (None, "")
        ]
        if missing:
            raise serializers.ValidationError(
                {field_name: "This field is required." for field_name in missing}
            )

    @transaction.atomic
    def create(self, validated_data):
        uploaded_images = validated_data.pop("images", [])
        listing = ProductListing.objects.create(**validated_data)
        self._save_images(listing, uploaded_images)
        return listing

    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop("images", [])
        listing = super().update(instance, validated_data)
        self._save_images(listing, uploaded_images)
        return listing

    @staticmethod
    def _save_images(listing, uploaded_images):
        for position, image in enumerate(uploaded_images, start=listing.images.count()):
            ProductImage.objects.create(
                listing=listing,
                image=image,
                position=position,
            )


class ListingInquirySerializer(serializers.ModelSerializer):
    listing = ProductListingSummarySerializer(read_only=True)
    buyer = serializers.SerializerMethodField()
    seller = serializers.SerializerMethodField()

    class Meta:
        model = ListingInquiry
        fields = [
            "id",
            "listing",
            "buyer",
            "seller",
            "message",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_buyer(self, inquiry):
        return user_contact(inquiry.buyer)

    def get_seller(self, inquiry):
        return user_contact(inquiry.seller)


class ListingInquiryCreateSerializer(serializers.ModelSerializer):
    listing_id = serializers.PrimaryKeyRelatedField(
        source="listing",
        queryset=ProductListing.objects.filter(
            listing_type__in=[
                ProductListing.ListingType.CAR,
                ProductListing.ListingType.BIKE,
            ],
            status=ProductListing.Status.ACTIVE,
        ),
    )

    class Meta:
        model = ListingInquiry
        fields = ["listing_id", "message"]

    def validate(self, attrs):
        if attrs["listing"].owner_id == self.context["request"].user.pk:
            raise serializers.ValidationError(
                {"listing_id": "You cannot inquire about your own listing."}
            )
        return attrs

    def create(self, validated_data):
        listing = validated_data["listing"]
        return ListingInquiry.objects.create(
            buyer=self.context["request"].user,
            seller=listing.owner,
            **validated_data,
        )


class ListingInquiryUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingInquiry
        fields = ["status"]

    def validate_status(self, status):
        if self.instance.seller_id != self.context["request"].user.pk:
            raise serializers.ValidationError("Only the seller can update this inquiry.")
        transitions = {
            ListingInquiry.Status.NEW: {
                ListingInquiry.Status.CONTACTED,
                ListingInquiry.Status.CLOSED,
            },
            ListingInquiry.Status.CONTACTED: {ListingInquiry.Status.CLOSED},
        }
        if status not in transitions.get(self.instance.status, set()):
            raise serializers.ValidationError("This inquiry status transition is not allowed.")
        return status


class ProductOrderSerializer(serializers.ModelSerializer):
    listing = ProductListingSummarySerializer(read_only=True)
    buyer = serializers.SerializerMethodField()
    seller = serializers.SerializerMethodField()
    total_price = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = ProductOrder
        fields = [
            "id",
            "listing",
            "buyer",
            "seller",
            "quantity",
            "unit_price",
            "total_price",
            "fulfillment_method",
            "delivery_address",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_buyer(self, order):
        return user_contact(order.buyer)

    def get_seller(self, order):
        return user_contact(order.seller)


class ProductOrderCreateSerializer(serializers.Serializer):
    listing_id = serializers.PrimaryKeyRelatedField(
        source="listing",
        queryset=ProductListing.objects.filter(
            listing_type=ProductListing.ListingType.SPARE_PART,
            status=ProductListing.Status.ACTIVE,
        ),
    )
    quantity = serializers.IntegerField(min_value=1)
    fulfillment_method = serializers.ChoiceField(
        choices=ProductOrder.FulfillmentMethod.choices
    )
    delivery_address = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=2000,
    )

    def validate(self, attrs):
        listing = attrs["listing"]
        buyer = self.context["request"].user
        if listing.owner_id == buyer.pk:
            raise serializers.ValidationError(
                {"listing_id": "You cannot order your own listing."}
            )
        if attrs["quantity"] > listing.quantity_available:
            raise serializers.ValidationError(
                {"quantity": "The requested quantity is not available."}
            )
        if (
            attrs["fulfillment_method"] == ProductOrder.FulfillmentMethod.SHIPPING
            and not attrs.get("delivery_address", "").strip()
        ):
            raise serializers.ValidationError(
                {"delivery_address": "Enter a delivery address for shipping."}
            )
        if attrs["fulfillment_method"] == ProductOrder.FulfillmentMethod.PICKUP:
            attrs["delivery_address"] = ""
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        listing = (
            ProductListing.objects.select_for_update()
            .get(pk=validated_data["listing"].pk)
        )
        if (
            listing.status != ProductListing.Status.ACTIVE
            or listing.listing_type != ProductListing.ListingType.SPARE_PART
        ):
            raise serializers.ValidationError(
                {"listing_id": "This listing is not available to order."}
            )
        quantity = validated_data["quantity"]
        if quantity > listing.quantity_available:
            raise serializers.ValidationError(
                {"quantity": "The requested quantity is no longer available."}
            )

        order = ProductOrder.objects.create(
            listing=listing,
            buyer=self.context["request"].user,
            seller=listing.owner,
            quantity=quantity,
            unit_price=listing.price,
            fulfillment_method=validated_data["fulfillment_method"],
            delivery_address=validated_data.get("delivery_address", ""),
        )
        listing.quantity_available -= quantity
        update_fields = ["quantity_available", "updated_at"]
        if listing.quantity_available == 0:
            listing.status = ProductListing.Status.SOLD
            update_fields.append("status")
        listing.save(update_fields=update_fields)
        return order


class ProductOrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductOrder
        fields = ["status"]

    def validate_status(self, status):
        actor_id = self.context["request"].user.pk
        if status == ProductOrder.Status.CANCELLED:
            if actor_id not in (self.instance.buyer_id, self.instance.seller_id):
                raise serializers.ValidationError("You cannot update this order.")
            if (
                actor_id == self.instance.buyer_id
                and self.instance.status != ProductOrder.Status.PENDING
            ):
                raise serializers.ValidationError(
                    "Only pending orders can be cancelled by the buyer."
                )
            if self.instance.status in (
                ProductOrder.Status.CANCELLED,
                ProductOrder.Status.COMPLETED,
            ):
                raise serializers.ValidationError("This order can no longer be changed.")
            return status

        if actor_id != self.instance.seller_id:
            raise serializers.ValidationError("Only the seller can update this order.")
        allowed_transitions = {
            ProductOrder.Status.PENDING: {ProductOrder.Status.CONFIRMED},
            ProductOrder.Status.CONFIRMED: {ProductOrder.Status.COMPLETED},
        }
        if status not in allowed_transitions.get(self.instance.status, set()):
            raise serializers.ValidationError(
                "This order status transition is not allowed."
            )
        return status

    def update(self, instance, validated_data):
        try:
            instance.transition_to(
                validated_data["status"],
                self.context["request"].user,
            )
        except DjangoValidationError as error:
            raise serializers.ValidationError({"status": error.messages}) from error
        return instance


class ProductListingModerationSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=("approve", "reject"))
    moderation_note = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=2000,
    )

    def save(self, **kwargs):
        listing = self.context["listing"]
        reviewer = self.context["request"].user
        try:
            if self.validated_data["action"] == "approve":
                listing.approve(reviewer)
            else:
                listing.reject(reviewer, self.validated_data.get("moderation_note", ""))
        except DjangoValidationError as error:
            raise serializers.ValidationError({"detail": error.messages}) from error
        return listing
