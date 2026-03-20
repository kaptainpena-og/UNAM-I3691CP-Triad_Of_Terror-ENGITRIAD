import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const POSTS = [
  {
    id: '1',
    user: 'nature_lens',
    location: 'Yosemite Valley',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=950&q=80',
    likes: 1245,
    caption: 'A perfect sunset after a long hike.',
  },
  {
    id: '2',
    user: 'urban.tales',
    location: 'Downtown',
    image: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=950&q=80',
    likes: 843,
    caption: 'City lights and neon nights.',
  },
  {
    id: '3',
    user: 'coffeetime',
    location: 'Local cafe',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=950&q=80',
    likes: 679,
    caption: 'Best way to start the day.',
  },
];

function PostCard({post}: {post: typeof POSTS[number]}) {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.user[0].toUpperCase()}</Text>
        </View>
        <View style={styles.postDetails}>
          <ThemedText type="subtitle" style={styles.username}>{post.user}</ThemedText>
          <Text style={styles.location}>{post.location}</Text>
        </View>
      </View>
      <Image source={{ uri: post.image }} style={styles.postImage} />
      <View style={styles.postFooter}>
        <Text style={styles.likes}>{post.likes.toLocaleString()} likes</Text>
        <Text style={styles.caption}><Text style={styles.username}>{post.user}</Text> {post.caption}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>insta-clone</Text>
        <Text style={styles.subtitle}>mockup feed</Text>
      </View>
      <ScrollView contentContainerStyle={styles.feed}>
        {POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    textTransform: 'lowercase',
  },
  subtitle: {
    color: '#555',
    fontSize: 12,
    marginTop: 2,
  },
  feed: {
    padding: 12,
    gap: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderColor: '#eee',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '700',
  },
  postDetails: {
    marginLeft: 10,
  },
  username: {
    fontWeight: '700',
  },
  location: {
    fontSize: 12,
    color: '#666',
  },
  postImage: {
    width: '100%',
    height: 260,
    backgroundColor: '#f3f3f3',
  },
  postFooter: {
    padding: 10,
  },
  likes: {
    fontWeight: '700',
    marginBottom: 6,
  },
  caption: {
    color: '#333',
  },
});
