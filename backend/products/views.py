from decimal import Decimal, InvalidOperation

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ListingInquiry, ProductImage, ProductListing, ProductOrder
from .permissions import IsListingOwnerOrStaff
from .serializers import (
    ListingInquiryCreateSerializer,
    ListingInquirySerializer,
    ListingInquiryUpdateSerializer,
    ProductListingModerationSerializer,
    ProductListingSerializer,
    ProductOrderCreateSerializer,
    ProductOrderSerializer,
    ProductOrderUpdateSerializer,
)


class ProductListingListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ProductListingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self):
        queryset = ProductListing.objects.filter(
            status=ProductListing.Status.ACTIVE
        ).select_related("owner").prefetch_related("images")
        params = self.request.query_params

        listing_type = params.get("listing_type")
        if listing_type:
            queryset = queryset.filter(listing_type=listing_type)
        condition = params.get("condition")
        if condition:
            queryset = queryset.filter(condition=condition)
        make = params.get("make")
        if make:
            queryset = queryset.filter(make__icontains=make)
        model_name = params.get("model")
        if model_name:
            queryset = queryset.filter(model_name__icontains=model_name)
        location = params.get("location")
        if location:
            queryset = queryset.filter(location__icontains=location)
        for parameter, lookup in (
            ("min_price", "price__gte"),
            ("max_price", "price__lte"),
        ):
            value = params.get(parameter)
            if value is not None:
                try:
                    price = Decimal(value)
                except InvalidOperation:
                    raise ValidationError(
                        {parameter: "Enter a valid price."}
                    ) from None
                if not price.is_finite() or price < 0:
                    raise ValidationError(
                        {parameter: "Enter a valid non-negative price."}
                    )
                queryset = queryset.filter(**{lookup: price})
        search = params.get("search")
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(make__icontains=search)
                | Q(model_name__icontains=search)
                | Q(part_name__icontains=search)
                | Q(brand__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class MyProductListingListAPIView(generics.ListAPIView):
    serializer_class = ProductListingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = ProductListing.objects.filter(
            owner=self.request.user
        ).exclude(status=ProductListing.Status.DELETED).prefetch_related("images")
        listing_status = self.request.query_params.get("status")
        if listing_status:
            queryset = queryset.filter(status=listing_status)
        return queryset


class ProductListingDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductListingSerializer
    permission_classes = [
        permissions.IsAuthenticatedOrReadOnly,
        IsListingOwnerOrStaff,
    ]
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get_queryset(self):
        queryset = ProductListing.objects.select_related(
            "owner",
            "reviewed_by",
        ).prefetch_related("images")
        if self.request.user.is_staff:
            return queryset
        if self.request.user.is_authenticated:
            return queryset.filter(
                Q(status=ProductListing.Status.ACTIVE)
                | Q(owner=self.request.user)
            )
        return queryset.filter(status=ProductListing.Status.ACTIVE)

    def perform_update(self, serializer):
        listing = serializer.instance
        if listing.status in (
            ProductListing.Status.SOLD,
            ProductListing.Status.EXPIRED,
            ProductListing.Status.DELETED,
        ):
            raise ValidationError("This listing can no longer be edited.")

        if (
            not self.request.user.is_staff
            and listing.approved_at is not None
        ):
            serializer.save(
                status=ProductListing.Status.PENDING,
                moderation_note="",
                reviewed_by=None,
                reviewed_at=None,
                approved_at=None,
            )
            return
        serializer.save()

    def perform_destroy(self, instance):
        instance.status = ProductListing.Status.DELETED
        instance.save(update_fields=["status", "updated_at"])


class ProductListingModerationAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        listing = get_object_or_404(ProductListing, pk=pk)
        serializer = ProductListingModerationSerializer(
            data=request.data,
            context={"request": request, "listing": listing},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            ProductListingSerializer(
                listing,
                context={"request": request},
            ).data
        )


class ProductListingActionAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        listing = get_object_or_404(ProductListing, pk=pk)
        if listing.owner_id != request.user.pk and not request.user.is_staff:
            raise PermissionDenied("Only the listing owner can perform this action.")

        action = request.data.get("action")
        if action == "pause" and listing.status == ProductListing.Status.ACTIVE:
            listing.status = ProductListing.Status.PAUSED
        elif action == "resume" and listing.status == ProductListing.Status.PAUSED:
            listing.status = ProductListing.Status.PENDING
            listing.approved_at = None
            listing.reviewed_at = None
            listing.reviewed_by = None
        elif (
            action == "mark_sold"
            and listing.status
            in (ProductListing.Status.ACTIVE, ProductListing.Status.PAUSED)
        ):
            listing.status = ProductListing.Status.SOLD
        else:
            raise ValidationError({"action": "This action is not allowed."})

        listing.save(
            update_fields=[
                "status",
                "approved_at",
                "reviewed_at",
                "reviewed_by",
                "updated_at",
            ]
        )
        return Response(
            ProductListingSerializer(
                listing,
                context={"request": request},
            ).data
        )


class ProductImageDeleteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, listing_id, image_id):
        listing = get_object_or_404(ProductListing, pk=listing_id)
        if listing.owner_id != request.user.pk and not request.user.is_staff:
            raise PermissionDenied("Only the listing owner can remove its photos.")
        image = get_object_or_404(
            ProductImage,
            pk=image_id,
            listing=listing,
        )
        image.image.delete(save=False)
        image.delete()

        if listing.approved_at is not None:
            listing.status = ProductListing.Status.PENDING
            listing.approved_at = None
            listing.reviewed_by = None
            listing.reviewed_at = None
            listing.save(
                update_fields=[
                    "status",
                    "approved_at",
                    "reviewed_by",
                    "reviewed_at",
                    "updated_at",
                ]
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


class ListingInquiryListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ListingInquiry.objects.filter(
            Q(buyer=self.request.user) | Q(seller=self.request.user)
        ).select_related("listing", "buyer", "seller")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ListingInquiryCreateSerializer
        return ListingInquirySerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        inquiry = serializer.save()
        return Response(
            ListingInquirySerializer(
                inquiry,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_201_CREATED,
        )


class ListingInquiryDetailAPIView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ListingInquiry.objects.filter(
            Q(buyer=self.request.user) | Q(seller=self.request.user)
        ).select_related("listing", "buyer", "seller")

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return ListingInquiryUpdateSerializer
        return ListingInquirySerializer


class ProductOrderListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProductOrder.objects.filter(
            Q(buyer=self.request.user) | Q(seller=self.request.user)
        ).select_related("listing", "buyer", "seller")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProductOrderCreateSerializer
        return ProductOrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(
            ProductOrderSerializer(
                order,
                context=self.get_serializer_context(),
            ).data,
            status=status.HTTP_201_CREATED,
        )


class ProductOrderDetailAPIView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProductOrder.objects.filter(
            Q(buyer=self.request.user) | Q(seller=self.request.user)
        ).select_related("listing", "buyer", "seller")

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return ProductOrderUpdateSerializer
        return ProductOrderSerializer
