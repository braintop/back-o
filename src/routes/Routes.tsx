import { Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Lessons from '../pages/Lessons/Lessons';
import Home from '../pages/Home';
import Courses from '../pages/Courses';
import FrontCourseLessonsView from '../pages/FrontCourseLessonsView';
import FrontLessonsView from '../pages/FrontLessonsView';
import CreateCourse from '../pages/CreateCourse';
import EditCourse from '../pages/EditCourse';
import CourseDetails from '../pages/CourseDetails';
import VideoCourses from '../pages/video/VideoCourses';
import CreateVideoCourse from '../pages/video/CreateVideoCourse';
import VideoCourseDetails from '../pages/video/VideoCourseDetails';
import VideoCoursesView from '../pages/video/VideoCoursesView';
import VideoCourseView from '../pages/video/VideoCourseView';
import CreateLesson from '../pages/CreateLesson';
import EditLesson from '../pages/EditLesson';
import SharedFiles from '../pages/SharedFiles';
import ProtectedRoute from '../components/ProtectedRoute';
import Profile from '../pages/Profile';
import ForgotPassword from '../pages/ForgotPassword';
import Games from '../pages/games/Games';
import SQLEnglishGame from '../pages/games/SQLEnglishGame';
import Leaderboard from '../pages/games/Leaderboard';
import GameHistory from '../pages/games/GameHistory';

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
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route 
        path="/register" 
        element={
          <ProtectedRoute allowedEmails={['asaf.amir@gmail.com']}>
            <Register />
          </ProtectedRoute>
        } 
      />
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
        path="/front-lessons" 
        element={
          <ProtectedRoute>
            <FrontLessonsView />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/front-lessons/:courseId" 
        element={
          <ProtectedRoute>
            <FrontCourseLessonsView />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/video-courses" 
        element={
          <ProtectedRoute>
            <VideoCourses />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/video-courses/new" 
        element={
          <ProtectedRoute>
            <CreateVideoCourse />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/video-courses/:courseId" 
        element={
          <ProtectedRoute>
            <VideoCourseDetails />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/video-courses/view" 
        element={
          <ProtectedRoute>
            <VideoCoursesView />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/video-courses/view/:courseId" 
        element={
          <ProtectedRoute>
            <VideoCourseView />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/video-courses/view/:courseId/:lessonId" 
        element={
          <ProtectedRoute>
            <VideoCourseView />
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
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route path="/games" element={<Games />} />
      <Route path="/games/:gameId" element={<SQLEnglishGame />} />
      <Route path="/games/:gameId/leaderboard" element={<Leaderboard />} />
      <Route path="/games/:gameId/history" element={<GameHistory />} />
    </Routes>
  );
}

