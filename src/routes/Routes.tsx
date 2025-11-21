import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Lessons from '../pages/Lessons/Lessons';
import Home from '../pages/Home';
import Courses from '../pages/Courses';
import CreateCourse from '../pages/CreateCourse';
import EditCourse from '../pages/EditCourse';
import CourseDetails from '../pages/CourseDetails';
import CreateLesson from '../pages/CreateLesson';
import EditLesson from '../pages/EditLesson';
import SharedFiles from '../pages/SharedFiles';
import ProtectedRoute from '../components/ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } 
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route 
        path="/lessons" 
        element={
          <ProtectedRoute>
            <Lessons />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/courses" 
        element={
          <ProtectedRoute>
            <Courses />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/courses/new" 
        element={
          <ProtectedRoute>
            <CreateCourse />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/courses/:courseId" 
        element={
          <ProtectedRoute>
            <CourseDetails />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/courses/:courseId/edit" 
        element={
          <ProtectedRoute>
            <EditCourse />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/courses/:courseId/lessons/new" 
        element={
          <ProtectedRoute>
            <CreateLesson />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/courses/:courseId/lessons/:lessonId/edit" 
        element={
          <ProtectedRoute>
            <EditLesson />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/shared-files" 
        element={
          <ProtectedRoute>
            <SharedFiles />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

