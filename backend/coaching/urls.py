from django.urls import path
from .views import (
    CoachRelationshipView, CoachRequestsView, RespondToRequestView,
    StudentsListView, StudentDataView, AssignTechniqueView,
    DrillingPlanView, StudentDrillingPlansView,
)

urlpatterns = [
    path('relationship/', CoachRelationshipView.as_view(), name='coach-relationship'),
    path('requests/', CoachRequestsView.as_view(), name='coach-requests'),
    path('requests/<int:pk>/respond/', RespondToRequestView.as_view(), name='coach-respond'),
    path('students/', StudentsListView.as_view(), name='coach-students'),
    path('students/<int:student_id>/', StudentDataView.as_view(), name='coach-student-data'),
    path('students/<int:student_id>/assign-technique/', AssignTechniqueView.as_view(), name='coach-assign-technique'),
    path('students/<int:student_id>/drilling-plans/', StudentDrillingPlansView.as_view(), name='coach-student-plans'),
    path('drilling-plans/', DrillingPlanView.as_view(), name='drilling-plans'),
]
