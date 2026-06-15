from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'babies', views.BabyViewSet)
router.register(r'growth-records', views.GrowthRecordViewSet)
router.register(r'clothing-items', views.ClothingItemViewSet)
router.register(r'transfer-recipients', views.TransferRecipientViewSet)
router.register(r'transfer-records', views.TransferRecordViewSet)
router.register(r'season-plans', views.SeasonPlanViewSet, basename='seasonplan')
router.register(r'borrow-objects', views.BorrowObjectViewSet)
router.register(r'borrow-records', views.BorrowRecordViewSet, basename='borrowrecord')
router.register(r'storage-locations', views.StorageLocationViewSet)
router.register(r'care-records', views.CareRecordViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('statistics/', views.StatisticsView.as_view(), name='statistics'),
    path('growth-fit/', views.GrowthFitView.as_view(), name='growth-fit'),
]
