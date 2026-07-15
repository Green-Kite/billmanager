Pod::Spec.new do |s|
  s.name             = 'BillManagerPasskeys'
  s.version          = '0.1.0'
  s.summary          = 'BillManager native passkey ceremonies'
  s.description      = 'AuthenticationServices adapter for BillManager WebAuthn registration and assertions.'
  s.license          = { :type => 'MIT' }
  s.author           = 'BillManager'
  s.homepage         = 'https://billmanager.app'
  s.platforms        = { :ios => '16.4' }
  s.swift_version    = '5.9'
  s.source           = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AuthenticationServices'
  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
