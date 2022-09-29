import { GetStaticProps } from 'next';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { AiOutlineCalendar, AiOutlineUser } from 'react-icons/ai';
import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [next_page, setNextPage] = useState(postsPagination.next_page);

  function hanleNextPagePost() {
    fetch(next_page)
      .then(res => res.json())
      .then(data => {
        const newPost = data.results.map(post => {
          return {
            uid: post.uid,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
            first_publication_date: post.first_publication_date,
          };
        });

        setPosts([...posts, ...newPost]);
        setNextPage(data.next_page);
      });
  }

  return (
    <main className={commonStyles.container}>
      <div className={styles.posts}>
        {posts?.map(post => (
          <Link key={post.uid} href={`/post/${post.uid}`}>
            <a>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>
              <div className={commonStyles.info}>
                <time>
                  <AiOutlineCalendar />
                  <span>
                    {format(
                      parseISO(post.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </span>
                </time>
                <span>
                  <AiOutlineUser />
                  <span>{post.data.author}</span>
                </span>
              </div>
            </a>
          </Link>
        ))}
        {next_page && (
          <button
            className={styles.button}
            type="button"
            onClick={() => hanleNextPagePost()}
          >
            Carregar mais posts
          </button>
        )}
      </div>
    </main>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', {
    pageSize: 1,
  });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
      },
    },
  };
};
