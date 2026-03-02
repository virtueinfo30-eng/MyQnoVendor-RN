import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { getSession } from '../../utils/session';
import { fetchCompanyProfile } from '../../api/company';
import { fetchUserProfile } from '../../api/user_api';
import { theme } from '../../theme';
import { API_CONFIG } from '../../api/config';
import { CustomHeader } from '../../components/common/CustomHeader';
import { Loader, ToastService } from '../../components/common';

export const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUserProfile, setIsUserProfile] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const session = await getSession();
      if (session) {
        const userType = session.logged_user_type?.toLowerCase();
        // Native parity: roles 'u', 'q', 'l' see personal profile
        if (['u', 'q', 'l'].includes(userType)) {
          setIsUserProfile(true);
          const res = await fetchUserProfile(session.logged_user_id);
          if (res.success) {
            setProfile(res.data);
          } else {
            setProfile(session); // Fallback to session info
          }
        } else {
          setIsUserProfile(false);
          const data = await fetchCompanyProfile(session.logged_company_id);
          setProfile(Array.isArray(data) ? data[0] : data || session);
        }
      }
    } catch (e) {
      console.error(e);
      ToastService.show({ message: 'Failed to load profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    navigation.navigate('EditProfile');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Loader visible={loading} />
      </View>
    );
  }

  if (!profile)
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Profile not found</Text>
      </View>
    );

  const profilePic = isUserProfile
    ? profile.user_pic || profile.profile_pic
    : profile.company_logo;
  const picBaseUrl = isUserProfile
    ? API_CONFIG.BASE_URL + 'userpic/'
    : API_CONFIG.BASE_URL;

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Profile"
        navigation={navigation}
        showBackIcon={true}
      />
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.header}>
          {profilePic ? (
            <Image
              source={{ uri: picBaseUrl + profilePic }}
              style={styles.logo}
            />
          ) : (
            <View style={[styles.logo, styles.logoPlaceholder]}>
              <MaterialIcons
                name={isUserProfile ? 'person' : 'business'}
                size={40}
                color={theme.colors.white}
              />
            </View>
          )}
        </View>

        <View style={styles.form}>
          {isUserProfile ? (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={`${profile.first_name || ''} ${
                  profile.middle_name || ''
                } ${profile.last_name || ''}`.trim()}
                editable={false}
              />
              <Text style={styles.label}>Gender</Text>
              <TextInput
                style={styles.input}
                value={
                  profile.gender?.toUpperCase() === 'M' ? 'Male' : 'Female'
                }
                editable={false}
              />
              <Text style={styles.label}>Birth Date</Text>
              <TextInput
                style={styles.input}
                value={profile.birth_date}
                editable={false}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Company Name</Text>
              <TextInput
                style={styles.input}
                value={profile.company_name}
                editable={false}
              />
              <Text style={styles.label}>Contact Person</Text>
              <TextInput
                style={styles.input}
                value={profile.contact_person_name || profile.owner_full_name}
                editable={false}
              />
            </>
          )}

          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            value={
              profile.mobile_no || profile.reg_mobile || profile.owner_mobile
            }
            editable={false}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={
              profile.company_email ||
              profile.reg_email_id ||
              profile.owner_emailid
            }
            editable={false}
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={
              (profile.address || profile.company_address || '') +
              (profile.city_name ? `, ${profile.city_name}` : '') +
              (profile.state_name ? `, ${profile.state_name}` : '')
            }
            multiline
            editable={false}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    alignItems: 'center',
    padding: theme.spacing.l,
    backgroundColor: theme.colors.surface,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 20,
    right: '35%',
    backgroundColor: theme.colors.white,
    padding: 8,
    borderRadius: 20,
    ...theme.shadows.light,
  },
  form: { padding: theme.spacing.l },
  label: {
    fontSize: theme.fontSize.small,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.m,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.s,
    padding: theme.spacing.m,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
  },
  saveButton: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.radius.s,
    alignItems: 'center',
  },
  saveText: { color: theme.colors.white, fontWeight: 'bold' },
});
