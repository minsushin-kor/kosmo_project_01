import "../../css/common/pageTitle.css";

function PageTitle({ title, description }) {
  return (
    <section className="page-section">
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

export default PageTitle;
