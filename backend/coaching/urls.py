from django.urls import path
from .views import (
    CoachRelationshipView, CoachRequestsView, RespondToRequestView,
    StudentsListView, StudentDataView, AssignTechniqueView,
    DrillingPlanView, StudentDrillingPlansView,
    RemoveStudentView, CoachStudentNotesView, CoachSessionNoteView,
    StudentSessionNotesView, DrillPlanCheckInView,
    CoachSessionDetailView, CoachSessionEditView,
    StudentSessionEditsView, RespondToSessionEditView,
)

urlpatterns = [
    path('relationship/', CoachRelationshipView.as_view()),
    path('requests/', CoachRequestsView.as_view()),
    path('requests/<int:pk>/respond/', RespondToRequestView.as_view()),
    path('students/', StudentsListView.as_view()),
    path('students/<int:student_id>/', StudentDataView.as_view()),
    path('students/<int:student_id>/remove/', RemoveStudentView.as_view()),
    path('students/<int:student_id>/assign-technique/', AssignTechniqueView.as_view()),
    path('students/<int:student_id>/drilling-plans/', StudentDrillingPlansView.as_view()),
    path('students/<int:student_id>/session-notes/', CoachStudentNotesView.as_view()),
    path('students/<int:student_id>/sessions/<int:session_id>/', CoachSessionDetailView.as_view()),
    path('students/<int:student_id>/sessions/<int:session_id>/notes/', CoachSessionNoteView.as_view()),
    path('students/<int:student_id>/sessions/<int:session_id>/edits/', CoachSessionEditView.as_view()),
    path('drilling-plans/', DrillingPlanView.as_view()),
    path('drilling-plans/<int:plan_id>/check-in/', DrillPlanCheckInView.as_view()),
    path('session-notes/', StudentSessionNotesView.as_view()),
    path('session-edits/', StudentSessionEditsView.as_view()),
    path('session-edits/<int:edit_id>/respond/', RespondToSessionEditView.as_view()),
]
