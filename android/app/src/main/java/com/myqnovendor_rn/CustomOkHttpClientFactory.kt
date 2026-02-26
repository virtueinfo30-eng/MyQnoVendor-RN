package com.myqnovendor_rn

import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.OkHttpClientProvider
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Protocol
import okhttp3.Response

class CustomOkHttpClientFactory : OkHttpClientFactory {
    override fun createNewNetworkModuleClient(): OkHttpClient {
        return OkHttpClientProvider.createClientBuilder()
            .protocols(listOf(Protocol.HTTP_1_1))
            .addInterceptor(HeaderCaseInterceptor())
            .build()
    }

    class HeaderCaseInterceptor : Interceptor {
        private val headerMap = mapOf(
            "logged-user-id" to "Logged-User-Id",
            "user-master-id" to "User-Master-Id",
            "logged-user-type" to "Logged-User-Type",
            "logged-user-level" to "Logged-User-Level",
            "logged-company-id" to "Logged-Company-Id",
            "logged-location-id" to "Logged-Location-Id",
            "logged-queue-id" to "Logged-Queue-Id",
            "logged-user-group" to "Logged-User-Group",
            "logged-mobile" to "Logged-Mobile",
            "http-app-name" to "Http-App-Name",
            "http-app-type" to "Http-App-Type",
            "logged-master-id" to "Logged-Master-Id",
            "user-app-version" to "User-App-Version",
            "user-app-version-code" to "User-App-Version-Code",
            "authorization" to "Authorization",
            "accept" to "Accept",
            "content-type" to "Content-Type",
            "x-requested-with" to "X-Requested-With",
            "http-app-lang" to "Http-App-Lang"
        )

        override fun intercept(chain: Interceptor.Chain): Response {
            val originalRequest = chain.request()
            val requestBuilder = originalRequest.newBuilder()
            
            for (headerName in originalRequest.headers.names()) {
                val lowerName = headerName.lowercase()
                if (headerMap.containsKey(lowerName)) {
                    val correctName = headerMap[lowerName]!!
                    val value = originalRequest.header(headerName)
                    if (value != null) {
                        requestBuilder.removeHeader(headerName)
                        requestBuilder.addHeader(correctName, value)
                    }
                }
            }

            return chain.proceed(requestBuilder.build())
        }
    }
}
