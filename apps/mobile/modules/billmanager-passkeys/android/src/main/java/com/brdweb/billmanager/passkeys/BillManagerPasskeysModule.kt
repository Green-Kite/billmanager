package com.brdweb.billmanager.passkeys

import android.os.Build
import androidx.credentials.CreatePublicKeyCredentialRequest
import androidx.credentials.CreatePublicKeyCredentialResponse
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetPublicKeyCredentialOption
import androidx.credentials.PublicKeyCredential
import androidx.credentials.exceptions.CreateCredentialCancellationException
import androidx.credentials.exceptions.CreateCredentialException
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BillManagerPasskeysModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("BillManagerPasskeys")

    AsyncFunction("isSupported") {
      // Android's passkey implementation requires Android 9 (API 28) or newer.
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
    }

    AsyncFunction("createCredential") Coroutine { optionsJson: String ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
        throw PasskeyUnavailableException("Passkeys require Android 9 or newer.")
      }

      val activity = appContext.throwingActivity
      val manager = CredentialManager.create(activity)
      val request = CreatePublicKeyCredentialRequest(
        requestJson = optionsJson,
        preferImmediatelyAvailableCredentials = false,
      )

      try {
        val result = manager.createCredential(activity, request)
        val response = result as? CreatePublicKeyCredentialResponse
          ?: throw InvalidPasskeyResponseException("Credential Manager returned an unexpected credential type.")
        return@Coroutine response.registrationResponseJson
      } catch (error: CreateCredentialCancellationException) {
        throw PasskeyCancelledException("Passkey creation was cancelled.", error)
      } catch (error: CreateCredentialException) {
        throw PasskeyOperationException(error.localizedMessage ?: "Passkey creation failed.", error)
      }
    }

    AsyncFunction("getCredential") Coroutine { optionsJson: String ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
        throw PasskeyUnavailableException("Passkeys require Android 9 or newer.")
      }

      val activity = appContext.throwingActivity
      val manager = CredentialManager.create(activity)
      val request = GetCredentialRequest(
        credentialOptions = listOf(GetPublicKeyCredentialOption(requestJson = optionsJson)),
      )

      try {
        val credential = manager.getCredential(activity, request).credential
        val publicKeyCredential = credential as? PublicKeyCredential
          ?: throw InvalidPasskeyResponseException("Credential Manager returned an unexpected credential type.")
        return@Coroutine publicKeyCredential.authenticationResponseJson
      } catch (error: GetCredentialCancellationException) {
        throw PasskeyCancelledException("Passkey authentication was cancelled.", error)
      } catch (error: NoCredentialException) {
        throw PasskeyUnavailableException("No passkey is available for this account.", error)
      } catch (error: GetCredentialException) {
        throw PasskeyOperationException(error.localizedMessage ?: "Passkey authentication failed.", error)
      }
    }
  }
}

private class PasskeyUnavailableException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

private class PasskeyCancelledException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)

private class InvalidPasskeyResponseException(message: String) : CodedException(message)

private class PasskeyOperationException(message: String, cause: Throwable? = null) :
  CodedException(message, cause)
