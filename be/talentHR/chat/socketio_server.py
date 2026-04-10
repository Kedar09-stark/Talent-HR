import os
import asyncio
import logging
import socketio
from django.conf import settings

from asgiref.sync import sync_to_async
from django.apps import apps

# NOTE: Avoid importing Django models or app code at module import time.
# Models and other Django app code will be looked up at runtime inside
# the async handlers using `apps.get_model` so this module can be
# imported before Django app registry is fully populated.

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

logger.info('Imported chat.socketio_server module')

# Create an Async Socket.IO server - use polling as fallback for development
sio = socketio.AsyncServer(
    async_mode='asgi', 
    cors_allowed_origins='*',
    transports=['websocket', 'polling'],  # Support both WebSocket and polling
    logger=True,
    engineio_logger=True
)

logger.info('Socket.IO server initialized')


@sio.event
async def connect(sid, environ, auth=None):
    logger.info(f"[CONNECT] Client connected: sid={sid} auth={auth}")
    try:
        await sio.emit('connected', {'sid': sid}, to=sid)
        logger.info(f"[CONNECT] ✓ Sent connected ack to {sid}")
    except Exception:
        logger.exception('Failed to emit connected ack')


@sio.event
async def disconnect(sid):
    logger.info(f"Socket disconnected: {sid}")


@sio.event
async def test_connection(sid, data):
    logger.info(f"[TEST] Received test_connection from {sid}: {data}")
    await sio.emit('test_response', {'status': 'ok', 'message': 'Socket.IO is working'}, to=sid)
    logger.info(f"[TEST] ✓ Sent test_response to {sid}")


@sio.event
async def join_room(sid, data):
    # data: {room: 'room_name'}
    room = data.get('room')
    logger.info(f"[JOIN_ROOM] ENTERING - sid={sid} room={room}")
    if room:
        await sio.save_session(sid, {'room': room})
        logger.info(f"[JOIN_ROOM] Session saved for {sid}")
        await sio.enter_room(sid, room)
        logger.info(f"[JOIN_ROOM] {sid} entered room {room}")
        await sio.emit('joined', {'room': room}, room=room)
        logger.info(f"[JOIN_ROOM] ✓ {sid} successfully joined room {room}, broadcast 'joined' event")
    else:
        logger.warning(f"[JOIN_ROOM] No room provided for {sid}")


@sio.event
async def leave_room(sid, data):
    room = data.get('room')
    if room:
        await sio.leave_room(sid, room)
        await sio.emit('left', {'room': room}, room=room)
        logger.info(f"{sid} left room {room}")


@sio.event
async def typing(sid, data):
    # data: {conversationId, sender}
    room = data.get('room') or data.get('conversationId')
    payload = {
        'conversationId': data.get('conversationId'),
        'sender': data.get('sender'),
    }
    if room:
        await sio.emit('typing', payload, room=room, skip_sid=sid)
    logger.info(f"User {data.get('sender')} is typing in {room}")


@sio.event
async def stop_typing(sid, data):
    # data: {conversationId, sender}
    room = data.get('room') or data.get('conversationId')
    payload = {
        'conversationId': data.get('conversationId'),
        'sender': data.get('sender'),
    }
    if room:
        await sio.emit('stop_typing', payload, room=room, skip_sid=sid)
    logger.info(f"User {data.get('sender')} stopped typing in {room}")


@sio.event
async def send_message(sid, data):
    # data: {room, conversationId, sender, receiver, text, is_ai (optional), senderAvatar (optional), messageId (optional)}
    logger.info(f'[SEND_MESSAGE] RECEIVED event from sid={sid}')
    
    room = data.get('room')
    conversation_id = data.get('conversationId')
    text = data.get('text', '')
    sender = data.get('sender')
    receiver = data.get('receiver')
    is_ai = data.get('is_ai', False)
    sender_avatar = data.get('senderAvatar', '')
    message_id = data.get('messageId', '')

    logger.info(f'[SEND_MESSAGE] Data: room={room}, conv_id={conversation_id}, sender={sender}, receiver={receiver}, text={text[:20]}...')

    payload = {
        'conversationId': conversation_id,
        'sender': sender,
        'receiver': receiver,
        'text': text,
        'is_ai': is_ai,
        'senderAvatar': sender_avatar,
        'messageId': message_id,
    }

    # Save message to database (background)
    logger.info(f'[SEND_MESSAGE] Creating task to save message to DB')
    asyncio.create_task(_save_message(conversation_id, sender, text, is_ai, False, sid, room))

    # Broadcast to the room
    if room:
        logger.info(f'[SEND_MESSAGE] BROADCASTING to room: {room}')
        try:
            await sio.emit('message', payload, room=room)
            logger.info(f'[SEND_MESSAGE] ✓ Broadcast complete to room {room}')
        except Exception as e:
            logger.error(f'[SEND_MESSAGE] ✗ Broadcast failed: {e}')
        
        # Also broadcast to the reciprocal room to ensure both parties see it
        try:
            AccountsUser = apps.get_model('accounts', 'AccountsUser')
            sender_user = await sync_to_async(AccountsUser.objects.get)(username=sender)
            
            if room.startswith('hr-'):
                # Message sent to hr-X room, also send to candidate-Y room (where Y is the sender)
                reciprocal_room = f'candidate-{sender_user.id}'
                reciprocal_payload = payload.copy()
                reciprocal_payload['conversationId'] = reciprocal_room
                logger.info(f'[SEND_MESSAGE] BROADCASTING to reciprocal room: {reciprocal_room}')
                logger.info(f'[SEND_MESSAGE] Adjusted conversationId for reciprocal: {reciprocal_payload["conversationId"]}')
                try:
                    await sio.emit('message', reciprocal_payload, room=reciprocal_room)
                    logger.info(f'[SEND_MESSAGE] ✓ Broadcast complete to reciprocal room {reciprocal_room}')
                except Exception as e:
                    logger.warning(f'[SEND_MESSAGE] Reciprocal broadcast to {reciprocal_room} failed: {e}')
            elif room.startswith('candidate-'):
                # Message sent to candidate-X room, also send to hr-Y room (where Y is the sender)
                reciprocal_room = f'hr-{sender_user.id}'
                reciprocal_payload = payload.copy()
                reciprocal_payload['conversationId'] = reciprocal_room
                logger.info(f'[SEND_MESSAGE] BROADCASTING to reciprocal room: {reciprocal_room}')
                logger.info(f'[SEND_MESSAGE] Adjusted conversationId for reciprocal: {reciprocal_payload["conversationId"]}')
                try:
                    await sio.emit('message', reciprocal_payload, room=reciprocal_room)
                    logger.info(f'[SEND_MESSAGE] ✓ Broadcast complete to reciprocal room {reciprocal_room}')
                except Exception as e:
                    logger.warning(f'[SEND_MESSAGE] Reciprocal broadcast to {reciprocal_room} failed: {e}')
        except Exception as e:
            logger.warning(f'[SEND_MESSAGE] Failed to send reciprocal message: {e}')
    else:
        logger.info(f'[SEND_MESSAGE] Broadcasting to all clients (no room specified)')
        try:
            await sio.emit('message', payload)
            logger.info(f'[SEND_MESSAGE] ✓ Broadcast to all complete')
        except Exception as e:
            logger.error(f'[SEND_MESSAGE] ✗ Broadcast to all failed: {e}')

    # If this is an AI chat trigger, call Gemini and emit reply
    if data.get('ai') or is_ai:
        # call AI in background, pass conversation id so frontend can map reply
        asyncio.create_task(_handle_ai_reply(room, sender, receiver, text, conversation_id))


async def _handle_ai_reply(room, sender, receiver, text, conversation_id=None):
    try:
        system_instruction = "You are an assistant. Reply in plain text inside a JSON object {'reply': '...'}; return JSON only."
        user_prompt = f"{text}\n\nRespond only with JSON: { {'reply': 'string'} }"

        # call Gemini via existing utils (sync) - run in thread
        # import AI util at runtime to avoid importing Django app modules
        from jd_analyzer import utils_ai

        result = await sync_to_async(utils_ai.call_gemini)(text, system_instruction)

        # result may be a dict or error
        if isinstance(result, dict) and 'reply' in result:
            reply_text = result.get('reply')
        elif isinstance(result, dict) and 'error' in result:
            reply_text = f"AI error: {result.get('error')}"
        else:
            # attempt to convert to string
            reply_text = str(result)

        ai_payload = {
            'conversationId': conversation_id,
            'sender': 'AI',
            'receiver': sender,
            'text': reply_text,
            'is_ai': True,
        }

        # Save AI message to database (run in background)
        asyncio.create_task(_save_message(conversation_id, 'AI', reply_text, True, True))

        if room:
            await sio.emit('message', ai_payload, room=room)
        else:
            await sio.emit('message', ai_payload)

    except Exception as e:
        logger.exception('Error during AI reply: %s', e)
        err_payload = {'sender': 'AI', 'receiver': sender, 'text': f'AI error: {e}', 'is_ai': True}
        if room:
            await sio.emit('message', err_payload, room=room)
        else:
            await sio.emit('message', err_payload)


async def _save_message(conversation_id, sender, text, is_ai, is_ai_generated, sid=None, room=None):
    """Save message to database asynchronously"""
    try:
        # Parse conversation ID to determine type
        # Format: 'applicant-<app_id>' or 'job-application-<app_id>' or 'ai-bot' or 'ai-bot-<user_id>'
        # or 'hr-<hr_id>' (messages from candidate to HR) or 'candidate-<candidate_id>' (messages from HR to candidate)
        
        is_ai_conv = conversation_id and ('ai-bot' in str(conversation_id))
        is_hr_conv = conversation_id and str(conversation_id).startswith('hr-')
        is_candidate_conv = conversation_id and str(conversation_id).startswith('candidate-')

        # Resolve models at runtime to avoid app-loading issues
        ChatMessage = apps.get_model('chat', 'ChatMessage')
        AccountsUser = apps.get_model('accounts', 'AccountsUser')
        JobApplication = apps.get_model('jobs', 'JobApplication')
        Job = apps.get_model('jobs', 'Job')

        if is_ai_conv:
            # AI conversation - extract user ID if present
            user_id = None
            if '-' in str(conversation_id):
                try:
                    user_id = int(str(conversation_id).split('-')[-1])
                except ValueError:
                    pass

            if user_id:
                try:
                    user = await sync_to_async(AccountsUser.objects.get)(pk=user_id)
                except AccountsUser.DoesNotExist:
                    logger.warning('AI conversation user %s does not exist', user_id)
                    return

                sender_user = None
                if sender != 'AI':
                    try:
                        sender_user = await sync_to_async(AccountsUser.objects.get)(username=sender)
                    except AccountsUser.DoesNotExist:
                        sender_user = None

                # create chat message via sync_to_async
                saved = await sync_to_async(ChatMessage.objects.create)(
                    ai_chat_user=user,
                    sender=sender_user,
                    text=text,
                    is_ai=is_ai_generated
                )
                logger.info('Saved AI chat message id=%s for user=%s', getattr(saved, 'id', None), user.id)
                # notify the room/sid if provided via kwargs
                try:
                    if room:
                        await sio.emit('message_saved', {'message_id': saved.id, 'conversationId': conversation_id}, room=room)
                    elif sid:
                        await sio.emit('message_saved', {'message_id': saved.id, 'conversationId': conversation_id}, to=sid)
                except Exception:
                    logger.exception('Failed to emit message_saved for AI message')
        elif is_hr_conv or is_candidate_conv:
            # HR-Candidate unified conversation
            # Find the first application in this HR-candidate pair to use for storage
            try:
                if is_hr_conv:
                    # Format: hr-<hr_id>
                    hr_id = int(str(conversation_id).replace('hr-', ''))
                    # Find sender (candidate) and receiver (HR)
                    sender_user = await sync_to_async(AccountsUser.objects.get)(username=sender)
                    candidate_id = sender_user.id
                    
                    # Find any application between this candidate and HR
                    application = await sync_to_async(
                        lambda: JobApplication.objects.filter(
                            candidate_id=candidate_id,
                            job__created_by_id=hr_id
                        ).first()
                    )()
                    
                    if not application:
                        logger.warning(f'[_SAVE_MESSAGE] No application found for hr={hr_id}, candidate={candidate_id}')
                        return
                        
                elif is_candidate_conv:
                    # Format: candidate-<candidate_id>
                    candidate_id = int(str(conversation_id).replace('candidate-', ''))
                    # Find sender (HR) and receiver (candidate)
                    sender_user = await sync_to_async(AccountsUser.objects.get)(username=sender)
                    hr_id = sender_user.id
                    
                    # Find any application between this candidate and HR
                    application = await sync_to_async(
                        lambda: JobApplication.objects.filter(
                            candidate_id=candidate_id,
                            job__created_by_id=hr_id
                        ).first()
                    )()
                    
                    if not application:
                        logger.warning(f'[_SAVE_MESSAGE] No application found for hr={hr_id}, candidate={candidate_id}')
                        return
                
                saved = await sync_to_async(ChatMessage.objects.create)(
                    application=application,
                    sender=sender_user,
                    text=text,
                    is_ai=is_ai_generated
                )
                logger.info(f'[_SAVE_MESSAGE] ✓ Saved HR-candidate message id={saved.id} sender={sender_user.username}')
                
                try:
                    if room:
                        await sio.emit('message_saved', {'message_id': saved.id, 'conversationId': conversation_id}, room=room)
                    elif sid:
                        await sio.emit('message_saved', {'message_id': saved.id, 'conversationId': conversation_id}, to=sid)
                except Exception:
                    logger.exception('Failed to emit message_saved for HR-candidate message')
                    
            except AccountsUser.DoesNotExist:
                logger.warning(f'[_SAVE_MESSAGE] User not found: {sender}')
                return
            except Exception as e:
                logger.exception(f'[_SAVE_MESSAGE] Error saving HR-candidate message: {e}')
                return
        else:
            # Application conversation
            if conversation_id:
                try:
                    app_id = int(str(conversation_id).replace('applicant-', '').replace('job-application-', ''))
                except ValueError:
                    logger.warning('Invalid conversation id for application: %s', conversation_id)
                    return

                try:
                    application = await sync_to_async(JobApplication.objects.get)(pk=app_id)
                except JobApplication.DoesNotExist:
                    logger.warning('JobApplication %s does not exist', app_id)
                    return

                sender_user = None
                if sender != 'AI':
                    try:
                        logger.info(f'[_SAVE_MESSAGE] Looking up user with username={sender}')
                        sender_user = await sync_to_async(AccountsUser.objects.get)(username=sender)
                        logger.info(f'[_SAVE_MESSAGE] ✓ Found user: {sender_user.username} (id={sender_user.id})')
                    except AccountsUser.DoesNotExist:
                        logger.warning(f'[_SAVE_MESSAGE] User not found: {sender}')
                        sender_user = None

                saved = await sync_to_async(ChatMessage.objects.create)(
                    application=application,
                    sender=sender_user,
                    text=text,
                    is_ai=is_ai_generated
                )
                logger.info(f'[_SAVE_MESSAGE] ✓ Saved message id={saved.id} sender={sender_user.username if sender_user else "None"}')
                logger.info('Saved application chat message id=%s app=%s', getattr(saved, 'id', None), application.id)
                try:
                    if room:
                        await sio.emit('message_saved', {'message_id': saved.id, 'conversationId': conversation_id}, room=room)
                    elif sid:
                        await sio.emit('message_saved', {'message_id': saved.id, 'conversationId': conversation_id}, to=sid)
                except Exception:
                    logger.exception('Failed to emit message_saved for application message')
    except Exception as e:
        logger.exception(f'Error saving message: {e}')
