"""
Progress tracking module for the application.
This module handles tracking and displaying user progress.
"""
from flask import Blueprint, request, jsonify, g, current_app, render_template, abort
from database.models import User
from database.progress_models import UserProgress, UserPageView, UserInteraction, UserExercise
from auth import login_required
from datetime import datetime
import json

# Create the blueprint
progress_bp = Blueprint('progress', __name__, url_prefix='/progress')

@progress_bp.route('/api/track', methods=['POST'])
def track_progress():
    """
    API endpoint to receive tracking data from client.
    """
    # Check if user is logged in
    if not g.user:
        return jsonify({'error': 'User not authenticated'}), 401
    
    # Check content type
    if not request.is_json:
        return jsonify({'error': 'Content-Type must be application/json'}), 415
    
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Get required fields
    chapter_id = data.get('chapter_id')
    page_id = data.get('page_id')
    event_type = data.get('event_type')
    
    if not all([chapter_id, page_id, event_type]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    db_session = current_app.db_session
    user_id = g.user.id
    
    try:
        # Get or create user progress record
        user_progress = UserProgress.query.filter_by(user_id=user_id).first()
        if not user_progress:
            user_progress = UserProgress(
                user_id=user_id,
                total_pages_viewed=0,
                total_chapters_viewed=0,
                total_exercises_completed=0,
                overall_progress_percent=0
            )
            db_session.add(user_progress)
            db_session.flush()  # Get the ID without committing
        
        # Get or create page view record
        page_view = UserPageView.query.filter_by(
            user_id=user_id,
            chapter_id=chapter_id,
            page_id=page_id
        ).first()
        
        if not page_view:
            # First view of this page
            page_view = UserPageView(
                user_id=user_id,
                progress_id=user_progress.id,
                chapter_id=chapter_id,
                page_id=page_id,
                page_title=data.get('page_title', f'{chapter_id}/{page_id}'),
                is_completed=False,
                completion_percent=0,
                time_spent_seconds=0,
                view_count=1
            )
            db_session.add(page_view)
            db_session.flush()
            
            # Update total pages viewed in UserProgress
            user_progress.total_pages_viewed += 1
            
            # Check if this is a new chapter
            chapter_views = UserPageView.query.filter_by(
                user_id=user_id,
                chapter_id=chapter_id
            ).count()
            
            if chapter_views <= 1:  # Only this new view
                user_progress.total_chapters_viewed += 1
        else:
            # Existing page view, update it
            page_view.last_viewed_at = datetime.utcnow()
            page_view.view_count += 1
        
        # Handle different event types
        if event_type == 'scroll':
            # Update scroll position / completion percentage
            scroll_percent = float(data.get('scroll_percent', 0))
            if scroll_percent > page_view.completion_percent:
                page_view.completion_percent = scroll_percent
            
            # Mark as completed if scrolled to near bottom (90%)
            if scroll_percent >= 90 and not page_view.is_completed:
                page_view.is_completed = True
                # Since each chapter is a single page, mark the chapter as completed too
                user_progress.total_chapters_completed = UserPageView.query.filter_by(
                    user_id=user_id,
                    is_completed=True
                ).count()
            
            # Record scroll interaction
            interaction = UserInteraction(
                user_id=user_id,
                page_view_id=page_view.id,
                interaction_type='scroll',
                interaction_data=json.dumps({'scroll_percent': scroll_percent})
            )
            db_session.add(interaction)
            
        elif event_type == 'time_spent':
            # Update time spent on page
            seconds = int(data.get('seconds', 0))
            page_view.time_spent_seconds += seconds
            
        elif event_type == 'exercise_attempt':
            # Record exercise attempt
            exercise_id = data.get('exercise_id')
            if exercise_id:
                exercise = UserExercise.query.filter_by(
                    user_id=user_id,
                    chapter_id=chapter_id,
                    exercise_id=exercise_id
                ).first()
                
                if not exercise:
                    exercise = UserExercise(
                        user_id=user_id,
                        chapter_id=chapter_id,
                        exercise_id=exercise_id,
                        exercise_title=data.get('exercise_title', f'Exercise {exercise_id}'),
                        attempts=0,
                        is_completed=False
                    )
                    db_session.add(exercise)
                    db_session.flush()
                
                exercise.attempts += 1
                exercise.code_submitted = data.get('code', '')
                
                if data.get('is_correct', False):
                    exercise.is_completed = True
                    exercise.completed_at = datetime.utcnow()
                    
                    # Update total exercises completed if this is the first completion
                    if not exercise.is_completed:
                        user_progress.total_exercises_completed += 1
                    
                    # Check if all exercises for this chapter are completed
                    all_chapter_exercises = UserExercise.query.filter_by(
                        user_id=user_id,
                        chapter_id=chapter_id
                    ).all()
                    
                    all_completed = all(ex.is_completed for ex in all_chapter_exercises) if all_chapter_exercises else True
                    
                    # If all exercises are completed and the user has scrolled to 90%, mark chapter as fully completed
                    if all_completed and page_view.completion_percent >= 90:
                        page_view.is_completed = True
                        # Update chapter completion count
                        user_progress.total_chapters_completed = UserPageView.query.filter_by(
                            user_id=user_id,
                            is_completed=True
                        ).count()
                
                # Record exercise interaction
                interaction = UserInteraction(
                    user_id=user_id,
                    page_view_id=page_view.id,
                    interaction_type='exercise',
                    interaction_data=json.dumps({
                        'exercise_id': exercise_id,
                        'attempt': exercise.attempts,
                        'is_correct': data.get('is_correct', False)
                    })
                )
                db_session.add(interaction)
        
        elif event_type == 'chapter_completed':
            # User explicitly marked the chapter as completed
            # Mark all related page views as completed
            chapter_views = UserPageView.query.filter_by(
                user_id=user_id,
                chapter_id=chapter_id
            ).all()
            
            for page_view in chapter_views:
                page_view.is_completed = True
                page_view.completion_percent = 100
            
            # Update chapter completion count - count distinct chapters
            completed_chapters = db_session.query(UserPageView.chapter_id).filter(
                UserPageView.user_id == user_id,
                UserPageView.is_completed == True
            ).distinct().count()
            
            user_progress.total_chapters_completed = completed_chapters
            
            # Record the completion interaction
            interaction = UserInteraction(
                user_id=user_id,
                page_view_id=page_view.id,
                interaction_type='chapter_completed',
                interaction_data=json.dumps({
                    'completion_type': data.get('completion_type', 'user_marked')
                })
            )
            db_session.add(interaction)
        
        # Calculate overall progress percentage
        # Since each chapter is a single page, we base progress on chapters completed
        # Get the actual total number of chapters available in the application
        # For now, we only have one chapter
        total_chapters = 1  # This should match the actual number of chapters you have
        
        # Weight completion in the overall progress
        chapter_weight = 0.7  # 70% of progress is chapter completion
        exercise_weight = 0.3  # 30% of progress is exercise completion
        
        chapter_progress = (user_progress.total_chapters_completed / total_chapters) * chapter_weight * 100 if total_chapters > 0 else 0
        
        # For exercises, we look at proportion of viewed chapters that have their exercises completed
        chapters_with_exercises = set([ex.chapter_id for ex in UserExercise.query.filter_by(user_id=user_id).all()])
        completed_chapter_exercises = set([ex.chapter_id for ex in UserExercise.query.filter_by(
            user_id=user_id, 
            is_completed=True
        ).all()])
        
        exercise_progress = 0
        if chapters_with_exercises:
            exercise_progress = (len(completed_chapter_exercises) / len(chapters_with_exercises)) * exercise_weight * 100
        
        user_progress.overall_progress_percent = chapter_progress + exercise_progress
        user_progress.last_activity_at = datetime.utcnow()
        
        db_session.commit()
        return jsonify({'success': True, 'progress': user_progress.overall_progress_percent})
        
    except Exception as e:
        db_session.rollback()
        current_app.logger.error(f"Error tracking progress: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@progress_bp.route('/dashboard')
@login_required
def user_dashboard():
    """
    Display the user's progress dashboard.
    """
    if not g.user:
        abort(401)
    
    # Get the user's progress data
    user_progress = UserProgress.query.filter_by(user_id=g.user.id).first()
    
    if not user_progress:
        # If no progress data yet, create an empty record
        user_progress = UserProgress(user_id=g.user.id)
        db_session = current_app.db_session
        db_session.add(user_progress)
        db_session.commit()
    
    # Get page view data
    page_views = UserPageView.query.filter_by(user_id=g.user.id).all()
    
    # Get exercise data
    exercises = UserExercise.query.filter_by(user_id=g.user.id).all()
    
    # Organize data by chapter
    chapters = {}
    for view in page_views:
        if view.chapter_id not in chapters:
            chapters[view.chapter_id] = {
                'id': view.chapter_id,
                'title': view.chapter_id.replace('_', ' ').title(),
                'pages': [],
                'completed_pages': 0,
                'total_pages': 0,
                'exercises': [],
                'completed_exercises': 0
            }
        
        chapters[view.chapter_id]['pages'].append({
            'id': view.page_id,
            'title': view.page_title or view.page_id.replace('_', ' ').title(),
            'completed': view.is_completed,
            'completion_percent': view.completion_percent,
            'time_spent': view.time_spent_seconds,
            'last_viewed': view.last_viewed_at
        })
        
        chapters[view.chapter_id]['total_pages'] += 1
        if view.is_completed:
            chapters[view.chapter_id]['completed_pages'] += 1
    
    for exercise in exercises:
        if exercise.chapter_id in chapters:
            chapters[exercise.chapter_id]['exercises'].append({
                'id': exercise.exercise_id,
                'title': exercise.exercise_title or exercise.exercise_id.replace('_', ' ').title(),
                'completed': exercise.is_completed,
                'attempts': exercise.attempts,
                'score': exercise.score
            })
            
            if exercise.is_completed:
                chapters[exercise.chapter_id]['completed_exercises'] += 1
    
    # Convert to a sorted list
    chapter_list = sorted(chapters.values(), key=lambda x: x['id'])
    
    return render_template(
        'progress/dashboard.html',
        progress=user_progress,
        chapters=chapter_list
    )

@progress_bp.route('/admin')
@login_required
def admin_dashboard():
    """
    Display the admin analytics dashboard.
    Only accessible to users with admin role.
    """
    if not g.user or not g.user.has_role('admin'):
        abort(403)
    
    # Get all users with their progress
    users = User.query.all()
    user_data = []
    
    for user in users:
        progress = user.progress
        if not progress:
            continue
            
        user_data.append({
            'id': user.id,
            'username': user.username,
            'full_name': user.get_full_name(),
            'progress_percent': progress.overall_progress_percent,
            'chapters_viewed': progress.total_chapters_viewed,
            'pages_viewed': progress.total_pages_viewed,
            'exercises_completed': progress.total_exercises_completed,
            'last_active': progress.last_activity_at
        })
    
    # Get chapter completion statistics
    chapter_stats = {}
    page_views = UserPageView.query.all()
    
    for view in page_views:
        chapter_id = view.chapter_id
        if chapter_id not in chapter_stats:
            chapter_stats[chapter_id] = {
                'id': chapter_id,
                'title': chapter_id.replace('_', ' ').title(),
                'total_views': 0,
                'completions': 0,
                'unique_users': set()
            }
        
        chapter_stats[chapter_id]['total_views'] += 1
        chapter_stats[chapter_id]['unique_users'].add(view.user_id)
        
        if view.is_completed:
            chapter_stats[chapter_id]['completions'] += 1
    
    # Calculate completion percentages and convert sets to counts
    for chapter in chapter_stats.values():
        chapter['unique_users'] = len(chapter['unique_users'])
        if chapter['total_views'] > 0:
            chapter['completion_rate'] = (chapter['completions'] / chapter['total_views']) * 100
        else:
            chapter['completion_rate'] = 0
    
    # Convert to a sorted list
    chapter_list = sorted(chapter_stats.values(), key=lambda x: x['id'])
    
    return render_template(
        'progress/admin.html',
        users=user_data,
        chapters=chapter_list
    )
