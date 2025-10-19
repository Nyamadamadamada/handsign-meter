type Props = {
  no: number;
  content: string;
}

const Accuracy = ( { no, content }:Props) => {

  return (
    <tr>
      <th>{no}</th>
      <td className="accuracy" data-row-index={`${no}`}>
        {content}
      </td>
    </tr>
  );
};

export default Accuracy;
