package com.audioplayerapp

import android.app.Activity
import android.app.RecoverableSecurityException
import android.content.ContentUris
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File
import java.util.concurrent.Executors

/**
 * Native module that scans and deletes local device audio files via Android MediaStore.
 *
 * Returns an array of track objects with:
 * - id: String
 * - title: String
 * - artist: String
 * - album: String
 * - duration: Double (seconds)
 * - url: String (content:// URI)
 * - artwork: String? (content://media/external/audio/albumart/{albumId} or null)
 * - mimeType: String
 * - folder: String
 * - dateAdded: Double (Unix timestamp in seconds from MediaStore.DATE_ADDED)
 */
class LocalAudioModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val executor = Executors.newSingleThreadExecutor()
    private var pendingDeletePromise: Promise? = null
    private var pendingDeleteUri: Uri? = null

    private val activityEventListener: ActivityEventListener =
        object : BaseActivityEventListener() {
            override fun onActivityResult(
                activity: Activity,
                requestCode: Int,
                resultCode: Int,
                data: Intent?,
            ) {
                if (requestCode != DELETE_REQUEST_CODE) {
                    return
                }
                val promise = pendingDeletePromise ?: return
                val targetUri = pendingDeleteUri
                pendingDeletePromise = null
                pendingDeleteUri = null

                if (resultCode != Activity.RESULT_OK) {
                    promise.resolve(false)
                    return
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    promise.resolve(true)
                } else if (targetUri != null) {
                    executor.execute {
                        try {
                            val deleted = reactApplicationContext.contentResolver.delete(targetUri, null, null)
                            promise.resolve(deleted > 0)
                        } catch (_: Exception) {
                            promise.resolve(false)
                        }
                    }
                } else {
                    promise.resolve(false)
                }
            }
        }

    init {
        reactContext.addActivityEventListener(activityEventListener)
    }

    override fun getName(): String = "LocalAudioModule"

    @ReactMethod
    fun deleteAudioFile(id: String, promise: Promise) {
        executor.execute {
            try {
                val numericId = id.toLongOrNull()
                if (numericId == null) {
                    promise.resolve(false)
                    return@execute
                }
                val uri = ContentUris.withAppendedId(
                    MediaStore.Audio.Media.EXTERNAL_CONTENT_URI,
                    numericId,
                )

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    val activity = reactApplicationContext.currentActivity
                    if (activity == null) {
                        promise.resolve(false)
                        return@execute
                    }
                    val pendingIntent = MediaStore.createDeleteRequest(
                        reactApplicationContext.contentResolver,
                        listOf(uri),
                    )
                    pendingDeletePromise?.resolve(false)
                    pendingDeletePromise = promise
                    pendingDeleteUri = uri
                    activity.startIntentSenderForResult(
                        pendingIntent.intentSender,
                        DELETE_REQUEST_CODE,
                        null,
                        0,
                        0,
                        0,
                    )
                } else {
                    try {
                        val deleted = reactApplicationContext.contentResolver.delete(uri, null, null)
                        promise.resolve(deleted > 0)
                    } catch (securityException: SecurityException) {
                        if (Build.VERSION.SDK_INT == Build.VERSION_CODES.Q &&
                            securityException is RecoverableSecurityException
                        ) {
                            val activity = reactApplicationContext.currentActivity
                            if (activity == null) {
                                promise.resolve(false)
                                return@execute
                            }
                            pendingDeletePromise?.resolve(false)
                            pendingDeletePromise = promise
                            pendingDeleteUri = uri
                            activity.startIntentSenderForResult(
                                securityException.userAction.actionIntent.intentSender,
                                DELETE_REQUEST_CODE,
                                null,
                                0,
                                0,
                                0,
                            )
                        } else {
                            promise.resolve(false)
                        }
                    }
                }
            } catch (e: Exception) {
                pendingDeletePromise = null
                pendingDeleteUri = null
                promise.reject("DELETE_AUDIO_ERROR", e.message ?: "Failed to delete audio file", e)
            }
        }
    }

    companion object {
        private const val DELETE_REQUEST_CODE = 4201
    }

    @ReactMethod
    fun getAllAudioFiles(promise: Promise) {
        executor.execute {
            try {
                val results = Arguments.createArray()
                val contentResolver = reactApplicationContext.contentResolver
                val collection = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI

                val projectionList = mutableListOf(
                    MediaStore.Audio.Media._ID,
                    MediaStore.Audio.Media.TITLE,
                    MediaStore.Audio.Media.DISPLAY_NAME,
                    MediaStore.Audio.Media.ARTIST,
                    MediaStore.Audio.Media.ALBUM,
                    MediaStore.Audio.Media.ALBUM_ID,
                    MediaStore.Audio.Media.DURATION,
                    MediaStore.Audio.Media.MIME_TYPE,
                    MediaStore.Audio.Media.DATA,
                    MediaStore.Audio.Media.DATE_ADDED
                )

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    projectionList.add(MediaStore.Audio.Media.RELATIVE_PATH)
                }

                val selection =
                    "${MediaStore.Audio.Media.IS_MUSIC} != 0 OR ${MediaStore.Audio.Media.DURATION} > 0"
                val sortOrder = "${MediaStore.Audio.Media.DATE_ADDED} DESC"

                contentResolver.query(
                    collection,
                    projectionList.toTypedArray(),
                    selection,
                    null,
                    sortOrder
                )?.use { cursor ->
                    val idCol = cursor.getColumnIndex(MediaStore.Audio.Media._ID)
                    val titleCol = cursor.getColumnIndex(MediaStore.Audio.Media.TITLE)
                    val displayNameCol = cursor.getColumnIndex(MediaStore.Audio.Media.DISPLAY_NAME)
                    val artistCol = cursor.getColumnIndex(MediaStore.Audio.Media.ARTIST)
                    val albumCol = cursor.getColumnIndex(MediaStore.Audio.Media.ALBUM)
                    val albumIdCol = cursor.getColumnIndex(MediaStore.Audio.Media.ALBUM_ID)
                    val durationCol = cursor.getColumnIndex(MediaStore.Audio.Media.DURATION)
                    val mimeTypeCol = cursor.getColumnIndex(MediaStore.Audio.Media.MIME_TYPE)
                    val dataCol = cursor.getColumnIndex(MediaStore.Audio.Media.DATA)
                    val dateAddedCol = cursor.getColumnIndex(MediaStore.Audio.Media.DATE_ADDED)
                    val relativePathCol = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        cursor.getColumnIndex(MediaStore.Audio.Media.RELATIVE_PATH)
                    } else {
                        -1
                    }

                    while (cursor.moveToNext()) {
                        if (idCol < 0 || cursor.isNull(idCol)) {
                            continue
                        }

                        val id = cursor.getLong(idCol)
                        val rawTitle = cursor.safeString(titleCol)
                        val displayName = cursor.safeString(displayNameCol)
                        val title = when {
                            rawTitle.isNotBlank() -> rawTitle
                            displayName.isNotBlank() -> displayName.substringBeforeLast('.', displayName)
                            else -> ""
                        }

                        val artist = cursor.safeString(artistCol)
                        val album = cursor.safeString(albumCol)
                        val albumId = cursor.safeLong(albumIdCol)
                        val durationMs = cursor.safeLong(durationCol)
                        val durationSeconds = if (durationMs > 0L) durationMs / 1000.0 else 0.0
                        val mimeType = cursor.safeString(mimeTypeCol).ifBlank { "audio/*" }
                        val dataPath = cursor.safeString(dataCol)
                        val relativePath = cursor.safeString(relativePathCol)
                        val dateAdded = cursor.safeLong(dateAddedCol).toDouble()

                        val folder = extractFolderName(relativePath, dataPath)
                        val contentUri = ContentUris.withAppendedId(collection, id).toString()

                        val map = Arguments.createMap().apply {
                            putString("id", id.toString())
                            putString("title", title)
                            putString("artist", artist)
                            putString("album", album)
                            putDouble("duration", durationSeconds)
                            putString("url", contentUri)
                            if (albumId > 0L) {
                                putString(
                                    "artwork",
                                    "content://media/external/audio/albumart/$albumId"
                                )
                            } else {
                                putNull("artwork")
                            }
                            putString("mimeType", mimeType)
                            putString("folder", folder)
                            putDouble("dateAdded", dateAdded)
                        }

                        results.pushMap(map)
                    }
                }

                promise.resolve(results)
            } catch (e: SecurityException) {
                promise.reject("PERMISSION_DENIED", e.message ?: "Storage permission denied", e)
            } catch (e: Exception) {
                promise.reject("MEDIA_SCAN_ERROR", e.message ?: "Failed to scan local audio files", e)
            }
        }
    }

    private fun android.database.Cursor.safeString(columnIndex: Int): String {
        if (columnIndex < 0 || isNull(columnIndex)) {
            return ""
        }
        return getString(columnIndex) ?: ""
    }

    private fun android.database.Cursor.safeLong(columnIndex: Int): Long {
        if (columnIndex < 0 || isNull(columnIndex)) {
            return 0L
        }
        return getLong(columnIndex)
    }

    private fun extractFolderName(relativePath: String, dataPath: String): String {
        val trimmedRelative = relativePath.trim().trimEnd('/', '\\')
        if (trimmedRelative.isNotEmpty()) {
            val folder = trimmedRelative.substringAfterLast('/').substringAfterLast('\\')
            if (folder.isNotEmpty()) {
                return folder
            }
        }

        if (dataPath.isNotBlank()) {
            val parent = File(dataPath).parentFile?.name
            if (!parent.isNullOrBlank()) {
                return parent
            }
        }

        return ""
    }
}
