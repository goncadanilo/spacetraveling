import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { AiOutlineCalendar, AiOutlineUser } from 'react-icons/ai';
import { BiTime } from 'react-icons/bi';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { useRouter } from 'next/router';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  console.log(post);

  const router = useRouter();

  console.log(post);

  if (router.isFallback) {
    return <h2>Carregando...</h2>;
  }

  const formattedDate = format(
    parseISO(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));

    return total;
  }, 0);

  const averageReading = `${Math.ceil(totalWords / 200).toString()} min`;

  return (
    <main className={commonStyles.container}>
      <article className={styles.post}>
        <header className={styles.header}>
          <img src={post.data.banner.url} alt="banner" />
        </header>
        <h1>{post.data.title}</h1>
        <div className={commonStyles.info}>
          <time>
            <AiOutlineCalendar />
            <span>{formattedDate}</span>
          </time>
          <span>
            <AiOutlineUser />
            <span>{post.data.author}</span>
          </span>
          <span>
            <BiTime />
            <span>{averageReading}</span>
          </span>
        </div>
        {post.data.content.map(({ heading, body }) => (
          <div key={heading} className={styles.postContent}>
            {heading && <h2>{heading}</h2>}
            <div
              className={styles.postBody}
              dangerouslySetInnerHTML={{ __html: RichText.asHtml(body) }}
            />
          </div>
        ))}
      </article>
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});

  const posts = await prismic.getByType('posts', {
    pageSize: 2,
  });

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(slug));

  const post = {
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: content.body,
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
