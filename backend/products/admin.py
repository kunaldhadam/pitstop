from django.contrib import admin, messages
from django.core.exceptions import ValidationError

from .models import ListingInquiry, ProductImage, ProductListing, ProductOrder


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


class ListingInquiryInline(admin.TabularInline):
    model = ListingInquiry
    extra = 0
    can_delete = False
    readonly_fields = (
        "buyer",
        "seller",
        "message",
        "status",
        "created_at",
        "updated_at",
    )


@admin.register(ProductListing)
class ProductListingAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "listing_type",
        "owner",
        "price",
        "status",
        "created_at",
    )
    list_filter = ("listing_type", "status", "condition")
    search_fields = ("title", "make", "model_name", "part_name", "brand")
    readonly_fields = (
        "owner",
        "status",
        "moderation_note",
        "created_at",
        "updated_at",
        "reviewed_by",
        "reviewed_at",
        "approved_at",
    )
    inlines = (ProductImageInline, ListingInquiryInline)
    actions = ("approve_listings", "reject_listings")

    def has_add_permission(self, request):
        return False

    @admin.action(description="Approve selected pending listings")
    def approve_listings(self, request, queryset):
        approved = 0
        skipped = 0
        for listing in queryset:
            try:
                listing.approve(request.user)
            except ValidationError:
                skipped += 1
            else:
                approved += 1
        if approved:
            self.message_user(
                request,
                f"{approved} listing(s) approved.",
                level=messages.SUCCESS,
            )
        if skipped:
            self.message_user(
                request,
                (
                    f"{skipped} listing(s) were not approved. "
                    "They must be pending and have the required photos."
                ),
                level=messages.WARNING,
            )

    @admin.action(description="Reject selected pending listings")
    def reject_listings(self, request, queryset):
        rejected = 0
        skipped = 0
        for listing in queryset:
            try:
                listing.reject(request.user)
            except ValidationError:
                skipped += 1
            else:
                rejected += 1
        if rejected:
            self.message_user(
                request,
                f"{rejected} listing(s) rejected.",
                level=messages.SUCCESS,
            )
        if skipped:
            self.message_user(
                request,
                f"{skipped} listing(s) were not pending and were skipped.",
                level=messages.WARNING,
            )


@admin.register(ListingInquiry)
class ListingInquiryAdmin(admin.ModelAdmin):
    list_display = ("listing", "buyer", "seller", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("listing__title", "buyer__username", "seller__username")
    readonly_fields = (
        "listing",
        "buyer",
        "seller",
        "message",
        "status",
        "created_at",
        "updated_at",
    )


@admin.register(ProductOrder)
class ProductOrderAdmin(admin.ModelAdmin):
    list_display = (
        "listing",
        "buyer",
        "seller",
        "quantity",
        "total_price",
        "fulfillment_method",
        "status",
        "created_at",
    )
    list_filter = ("status", "fulfillment_method", "created_at")
    search_fields = ("listing__title", "buyer__username", "seller__username")
    readonly_fields = (
        "listing",
        "buyer",
        "seller",
        "quantity",
        "unit_price",
        "fulfillment_method",
        "delivery_address",
        "status",
        "created_at",
        "updated_at",
    )

    @admin.display(description="Total price")
    def total_price(self, order):
        return order.total_price
