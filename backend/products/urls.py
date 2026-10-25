from django.urls import path

from .views import (
    ListingInquiryDetailAPIView,
    ListingInquiryListCreateAPIView,
    MyProductListingListAPIView,
    ProductImageDeleteAPIView,
    ProductListingActionAPIView,
    ProductListingDetailAPIView,
    ProductListingListCreateAPIView,
    ProductListingModerationAPIView,
    ProductOrderDetailAPIView,
    ProductOrderListCreateAPIView,
)

urlpatterns = [
    path("listings/", ProductListingListCreateAPIView.as_view(), name="product-listings"),
    path(
        "listings/mine/",
        MyProductListingListAPIView.as_view(),
        name="my-product-listings",
    ),
    path(
        "listings/<int:pk>/",
        ProductListingDetailAPIView.as_view(),
        name="product-listing-detail",
    ),
    path(
        "listings/<int:pk>/moderate/",
        ProductListingModerationAPIView.as_view(),
        name="product-listing-moderate",
    ),
    path(
        "listings/<int:pk>/actions/",
        ProductListingActionAPIView.as_view(),
        name="product-listing-actions",
    ),
    path(
        "listings/<int:listing_id>/images/<int:image_id>/",
        ProductImageDeleteAPIView.as_view(),
        name="product-listing-image-detail",
    ),
    path(
        "inquiries/",
        ListingInquiryListCreateAPIView.as_view(),
        name="product-inquiries",
    ),
    path(
        "inquiries/<int:pk>/",
        ListingInquiryDetailAPIView.as_view(),
        name="product-inquiry-detail",
    ),
    path("orders/", ProductOrderListCreateAPIView.as_view(), name="product-orders"),
    path(
        "orders/<int:pk>/",
        ProductOrderDetailAPIView.as_view(),
        name="product-order-detail",
    ),
]
